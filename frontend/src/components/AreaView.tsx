import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Circle } from 'lucide-react';

interface AreaViewProps {
  areaId: string;
}

const AreaView: React.FC<AreaViewProps> = ({ areaId }) => {
  const { areas, projects, setSelectedProjectId, addProject, updateArea, updateProject } = useApp();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isEditingAreaName, setIsEditingAreaName] = useState(false);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [isEditingAreaColor, setIsEditingAreaColor] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  const area = areas.find(a => a.id === areaId);
  const areaProjects = projects.filter(p => p.areaId === areaId);
  
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

  if (!area) {
    return <div className="p-4">Area not found</div>;
  }

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      await addProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        areaId: areaId,
        deadline: null
      });
      setNewProjectName('');
      setNewProjectDescription('');
      setIsAddingProject(false);
    }
  };

  const cancelAddProject = () => {
    setIsAddingProject(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const startEditingAreaName = () => {
    setIsEditingAreaName(true);
    setEditingAreaName(area?.name || '');
  };

  const saveAreaName = async () => {
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

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6b7280'
  ];

  const startEditingAreaColor = () => {
    setIsEditingAreaColor(true);
  };

  const changeAreaColor = async (color: string) => {
    if (area) {
      await updateArea(area.id, { color });
      setIsEditingAreaColor(false);
    }
  };

  const cancelEditingAreaColor = () => {
    setIsEditingAreaColor(false);
  };

  const startEditingProjectName = (project: any) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const saveProjectName = async () => {
    if (editingProjectName.trim() && editingProjectId) {
      await updateProject(editingProjectId, { name: editingProjectName.trim() });
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  const cancelEditingProjectName = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Area Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Circle 
              className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ color: area.color }} 
              fill={area.color}
              onDoubleClick={startEditingAreaColor}
            />
            {isEditingAreaColor && (
              <div 
                ref={colorPickerRef}
                className="absolute top-10 left-0 z-10 p-6 bg-white rounded-lg shadow-lg border border-gray-200"
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
          {isEditingAreaName ? (
            <input
              type="text"
              value={editingAreaName}
              onChange={(e) => setEditingAreaName(e.target.value)}
              className="text-2xl font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1"
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
            <h2 
              className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors px-1 rounded hover:bg-gray-100"
              onDoubleClick={startEditingAreaName}
            >
              {area.name}
            </h2>
          )}
        </div>
        <p className="mt-2 text-gray-600">
          {areaProjects.length} {areaProjects.length === 1 ? 'project' : 'projects'} in this area
        </p>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areaProjects.map(project => {
            const projectTasks = project.tasks || [];
            const completedTasks = projectTasks.filter(t => t.status === 'completed');
            const completionPercentage = projectTasks.length > 0
              ? Math.round((completedTasks.length / projectTasks.length) * 100)
              : 0;

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="relative w-5 h-5">
                    <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 10}`}
                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - completionPercentage / 100)}`}
                        className="text-primary-500 transition-all"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500">
                    {completedTasks.length}/{projectTasks.length}
                  </span>
                </div>
                
                {editingProjectId === project.id ? (
                  <input
                    type="text"
                    value={editingProjectName}
                    onChange={(e) => setEditingProjectName(e.target.value)}
                    className="font-semibold text-gray-800 mb-1 bg-transparent border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                    autoFocus
                    onBlur={saveProjectName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveProjectName();
                      } else if (e.key === 'Escape') {
                        cancelEditingProjectName();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 
                    className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors px-1 rounded hover:bg-gray-100"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditingProjectName(project);
                    }}
                  >
                    {project.name}
                  </h3>
                )}
                
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{completionPercentage}% complete</span>
                </div>
              </button>
            );
          })}
          
          {/* Add Project Card */}
          {isAddingProject ? (
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300 min-h-[150px] flex flex-col">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProject();
                  if (e.key === 'Escape') cancelAddProject();
                }}
              />
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Project description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={handleAddProject}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Project
                </button>
                <button
                  onClick={cancelAddProject}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingProject(true)}
              className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-all flex flex-col items-center justify-center min-h-[150px]"
            >
              <Plus className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">New Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaView;