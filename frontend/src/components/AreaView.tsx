import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Circle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import ProjectModal from './modals/ProjectModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SortableProjectCardProps {
  project: any;
  onClick: () => void;
  onDoubleClick: () => void;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  onClick,
  onDoubleClick,
  isEditing,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const projectTasks = project.tasks || [];
  const completedTasks = projectTasks.filter((t: any) => t.status === 'completed');
  const completionPercentage = projectTasks.length > 0
    ? Math.round((completedTasks.length / projectTasks.length) * 100)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all text-left relative group ${
        isDragging ? 'shadow-xl ring-2 ring-primary-200 transform rotate-3' : ''
      }`}
    >
      {/* Task Count and Dropdown Menu */}
      <div className="absolute top-3 right-2 z-10 flex items-center gap-2" ref={dropdownRef}>
        <span className="text-xs text-gray-500">
          {completedTasks.length}/{projectTasks.length}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1 hover:bg-gray-200 rounded transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-8 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
                setShowDropdown(false);
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
                setShowDropdown(false);
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          if (!isDragging) {
            onClick();
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full text-left"
      >
        <div className="flex items-start mb-2">
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
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className="font-semibold text-gray-800 mb-1 bg-transparent border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            autoFocus
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors px-1 rounded hover:bg-gray-100"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
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
    </div>
  );
};

interface AreaViewProps {
  areaId: string;
  hideCompletedTasks?: boolean;
}

const AreaView: React.FC<AreaViewProps> = ({ areaId, hideCompletedTasks = false }) => {
  const { areas, projects, setSelectedProjectId, addProject, updateArea, updateProject, reorderProjects, deleteProject, deleteArea } = useApp();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isEditingAreaName, setIsEditingAreaName] = useState(false);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [isEditingAreaColor, setIsEditingAreaColor] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  const area = areas.find(a => a.id === areaId);
  const areaProjects = projects.filter(p => p.areaId === areaId).sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = areaProjects.findIndex(project => project.id === active.id);
      const newIndex = areaProjects.findIndex(project => project.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedProjects = arrayMove(areaProjects, oldIndex, newIndex);
        reorderProjects(reorderedProjects);
      }
    }
    
    setActiveId(null);
    setOverId(null);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsEditingAreaColor(false);
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setShowAreaDropdown(false);
      }
    };

    if (isEditingAreaColor || showAreaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingAreaColor, showAreaDropdown]);

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

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (project: any) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This will also delete all tasks in this project.`)) {
      await deleteProject(project.id);
    }
  };

  const handleEditArea = () => {
    startEditingAreaName();
    setShowAreaDropdown(false);
  };

  const handleDeleteArea = async () => {
    if (window.confirm(`Are you sure you want to delete the area "${area?.name}"? This will delete the area and move all projects to "No Area".`)) {
      await deleteArea(areaId);
      setShowAreaDropdown(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Area Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 mr-4">
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
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {areaProjects.length} {areaProjects.length === 1 ? 'project' : 'projects'}
            </span>
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
          
          {/* Area Actions Dropdown */}
          <div className="relative" ref={areaDropdownRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAreaDropdown(!showAreaDropdown);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Area Dropdown Menu */}
            {showAreaDropdown && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditArea();
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteArea();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={areaProjects.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areaProjects.map(project => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProjectId(project.id)}
                  onDoubleClick={() => startEditingProjectName(project)}
                  isEditing={editingProjectId === project.id}
                  editingName={editingProjectName}
                  onEditingNameChange={setEditingProjectName}
                  onSaveEdit={saveProjectName}
                  onCancelEdit={cancelEditingProjectName}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project)}
                />
              ))}
              
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
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className="transform rotate-2 shadow-2xl ring-2 ring-primary-200">
                <SortableProjectCard
                  project={areaProjects.find(p => p.id === activeId)!}
                  onClick={() => {}}
                  onDoubleClick={() => {}}
                  isEditing={false}
                  editingName=""
                  onEditingNameChange={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        editingProject={editingProject}
      />
    </div>
  );
};

export default AreaView;