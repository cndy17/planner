import React from 'react';
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
  } = useApp();

  const getTitle = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      return project?.name || 'Project';
    }
    if (selectedAreaId) {
      const area = areas.find(a => a.id === selectedAreaId);
      return area?.name || 'Area';
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
          <h1 className="text-2xl font-semibold text-gray-800">{getTitle()}</h1>
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