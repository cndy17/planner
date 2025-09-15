import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Menu, X } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobileMenuOpen }) => {
  const {
    selectedView,
    selectedProjectId,
    selectedAreaId,
    projects,
    areas,
    setIsQuickEntryOpen,
    setIsSearchModalOpen,
    updateArea,
  } = useApp();

  const [isEditingAreaName, setIsEditingAreaName] = useState(false);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [isEditingAreaColor, setIsEditingAreaColor] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project?.areaId) {
        const area = areas.find(a => a.id === project.areaId);
        return area?.name || 'Project';
      }
      return project?.name || 'Project';
    }
    if (selectedAreaId) {
      return '';
    }
    switch (selectedView) {
      case 'today':
        return 'Today';
      case 'upcoming':
        return 'Upcoming';
      case 'anytime':
        return 'Anytime';
      case 'someday':
        return 'Someday';
      case 'logbook':
        return 'Logbook';
      default:
        return 'Tasks';
    }
  };

  const getAreaForProject = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project?.areaId) {
        return areas.find(a => a.id === project.areaId);
      }
    }
    return null;
  };

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6b7280'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsEditingAreaColor(false);
      }
    };

    if (isEditingAreaColor) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingAreaColor]);

  const startEditingAreaName = (area: any) => {
    setIsEditingAreaName(true);
    setEditingAreaName(area.name);
  };

  const saveAreaName = async () => {
    const area = getAreaForProject();
    if (editingAreaName.trim() && area) {
      await updateArea(area.id, { name: editingAreaName.trim() });
      setIsEditingAreaName(false);
      setEditingAreaName('');
    }
  };

  const cancelEditingAreaName = () => {
    setIsEditingAreaName(false);
    setEditingAreaName('');
  };

  const startEditingAreaColor = () => {
    setIsEditingAreaColor(true);
  };

  const changeAreaColor = async (color: string) => {
    const area = getAreaForProject();
    if (area) {
      await updateArea(area.id, { color });
      setIsEditingAreaColor(false);
    }
  };

  const cancelEditingAreaColor = () => {
    setIsEditingAreaColor(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3">
            {getAreaForProject() && (
              <div className="relative">
                <div 
                  className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ backgroundColor: getAreaForProject()?.color }}
                  onDoubleClick={startEditingAreaColor}
                />
                {isEditingAreaColor && (
                  <div 
                    ref={colorPickerRef}
                    className="absolute top-8 left-0 z-50 p-6 bg-white rounded-lg shadow-lg border border-gray-200"
                  >
                    <div className="grid grid-cols-6 gap-4 mb-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => changeAreaColor(color)}
                          className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {isEditingAreaName ? (
              <input
                type="text"
                value={editingAreaName}
                onChange={(e) => setEditingAreaName(e.target.value)}
                className="text-2xl font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1"
                autoFocus
                onBlur={saveAreaName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveAreaName();
                  } else if (e.key === 'Escape') {
                    cancelEditingAreaName();
                  }
                }}
              />
            ) : (
              <h1 
                className="text-2xl font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors px-1 rounded hover:bg-gray-100"
                onDoubleClick={() => {
                  const area = getAreaForProject();
                  if (area) startEditingAreaName(area);
                }}
              >
                {getTitle()}
              </h1>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quick Find (⌘K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Quick Find</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-gray-100 rounded">⌘K</kbd>
          </button>
          
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            title="New Task (⌘N)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;