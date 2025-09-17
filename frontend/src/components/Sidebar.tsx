import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  Archive, 
  Folder, 
  Hash,
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  Edit2,
  CalendarCheck,
  Settings,
  Trash2
} from 'lucide-react';
import { ViewType, Area, Project } from '../types';
import AreaModal from './modals/AreaModal';
import ProjectModal from './modals/ProjectModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SortableProjectProps {
  project: Project;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  taskCount: number;
  isHovered: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditProject: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SortableProject: React.FC<SortableProjectProps> = ({
  project,
  isSelected,
  isEditing,
  editingName,
  taskCount,
  isHovered,
  onClick,
  onDoubleClick,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onEditProject,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}) => {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
        isSelected
          ? 'bg-primary-100 text-primary-700'
          : 'hover:bg-gray-100'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary-200' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex-1 flex items-center gap-2 text-left">
        <button
          onClick={onClick}
          className="flex items-center gap-2 text-left flex-1"
        >
        <Folder className="w-3 h-3" />
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            className="text-sm bg-transparent border border-primary-300 rounded px-1 py-0.5 min-w-0 flex-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="text-sm cursor-pointer truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
            }}
            onContextMenu={onContextMenu}
            title={project.name}
          >
            {project.name}
          </span>
        )}
        </button>
      </div>
      <div className="flex items-center gap-1">
        {taskCount > 0 && (
          <span className="text-xs text-gray-500">{taskCount}</span>
        )}
        {isHovered && (
          <button
            onClick={onEditProject}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit Project"
          >
            <Edit2 className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const {
    areas,
    projects,
    tags,
    selectedView,
    selectedProjectId,
    selectedAreaId,
    setSelectedView,
    setSelectedProjectId,
    setSelectedAreaId,
    setIsQuickEntryOpen,
    getTasksByView,
    getTasksByProject,
    getProjectsByArea,
    deleteArea,
    deleteProject,
    addArea,
    updateArea,
    updateProject,
    reorderProjects
  } = useApp();

  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [showAreas, setShowAreas] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedAreaForProject, setSelectedAreaForProject] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Inline editing states
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [editingProjectName, setEditingProjectName] = useState('');
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'area' | 'project';
    id: string;
  } | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay before drag starts
        tolerance: 8, // 8px of movement tolerance during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle adding new area
  const handleAddArea = () => {
    setIsAreaModalOpen(true);
  };

  const toggleArea = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeProject = projects.find(p => p.id === active.id);
      const overProject = projects.find(p => p.id === over?.id);
      
      if (activeProject && overProject && activeProject.areaId === overProject.areaId) {
        // Only reorder projects within the same area
        const areaProjects = projects
          .filter(p => p.areaId === activeProject.areaId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const oldIndex = areaProjects.findIndex(project => project.id === active.id);
        const newIndex = areaProjects.findIndex(project => project.id === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedProjects = arrayMove(areaProjects, oldIndex, newIndex);
          reorderProjects(reorderedProjects);
        }
      }
    }
    
    setActiveProjectId(null);
  };

  // Inline editing functions
  const startEditingArea = (area: Area) => {
    setEditingAreaId(area.id);
    setEditingAreaName(area.name);
    setContextMenu(null);
  };

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
    setContextMenu(null);
  };

  const saveAreaName = async () => {
    if (editingAreaId && editingAreaName.trim()) {
      await updateArea(editingAreaId, { name: editingAreaName.trim() });
    }
    setEditingAreaId(null);
    setEditingAreaName('');
  };

  const saveProjectName = async () => {
    if (editingProjectId && editingProjectName.trim()) {
      await updateProject(editingProjectId, { name: editingProjectName.trim() });
    }
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const cancelEditing = () => {
    setEditingAreaId(null);
    setEditingProjectId(null);
    setEditingAreaName('');
    setEditingProjectName('');
  };

  // Context menu functions
  const handleContextMenu = (e: React.MouseEvent, type: 'area' | 'project', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  };

  const handleContextAction = (action: string) => {
    if (!contextMenu) return;

    const { type, id } = contextMenu;
    
    if (type === 'area') {
      const area = areas.find(a => a.id === id);
      if (!area) return;
      
      switch (action) {
        case 'rename':
          startEditingArea(area);
          break;
        case 'edit':
          setEditingArea(area);
          setIsAreaModalOpen(true);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete the area "${area.name}"? This will also delete all projects and tasks in this area.`)) {
            deleteArea(area.id);
          }
          break;
      }
    } else if (type === 'project') {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      switch (action) {
        case 'rename':
          startEditingProject(project);
          break;
        case 'edit':
          setEditingProject(project);
          setIsProjectModalOpen(true);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This will also delete all tasks in this project.`)) {
            deleteProject(project.id);
          }
          break;
      }
    }
    
    setContextMenu(null);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setContextMenu(null);
      if (editingAreaId || editingProjectId) {
        const target = e.target as HTMLElement;
        if (!target.closest('input')) {
          cancelEditing();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingAreaId, editingProjectId]);

  const viewItems: { view: ViewType; icon: React.ReactNode; label: string }[] = [
    { view: 'today', icon: <Calendar className="w-4 h-4" />, label: 'Today' },
    { view: 'upcoming', icon: <CalendarDays className="w-4 h-4" />, label: 'Upcoming' },
    { view: 'anytime', icon: <Clock className="w-4 h-4" />, label: 'Anytime' },
    { view: 'someday', icon: <Archive className="w-4 h-4" />, label: 'Someday' },
    { view: 'logbook', icon: <Archive className="w-4 h-4" />, label: 'Logbook' },
    { view: 'calendar', icon: <CalendarCheck className="w-4 h-4" />, label: 'Calendar' },
  ];

  return (
    <>
      <div className="w-64 bg-gray-50 h-full flex flex-col border-r border-gray-200">

        {/* Views - Fixed at top */}
        <div className="px-2 py-2 border-b border-gray-200">
          {viewItems.map(({ view, icon, label }) => {
            const count = getTasksByView(view).length;
            return (
              <button
                key={view}
                onClick={() => {
                  setSelectedView(view);
                  setSelectedProjectId(null);
                  setSelectedAreaId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  selectedView === view && !selectedProjectId && !selectedAreaId
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {count > 0 && (
                  <span className="text-xs text-gray-500">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Middle Section - Contains scrollable areas */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Areas & Projects Header - Sticky */}
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="px-2 py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => setShowAreas(!showAreas)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800"
                >
                  {showAreas ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Areas & Projects</span>
                </button>
                <button
                  onClick={() => {
                    setEditingArea(null);
                    setIsAreaModalOpen(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Add Area"
                >
                  <Plus className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Areas Content */}
          {showAreas && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-2 py-2">
                {/* Inbox (tasks without project) */}
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    setSelectedAreaId(null);
                    setSelectedView('anytime');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    !selectedProjectId && !selectedAreaId && selectedView === 'anytime'
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-3 h-3" />
                    <span className="text-sm font-medium">Inbox</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {projects.filter(p => !p.areaId).length + 
                     getTasksByView('anytime').filter(t => !t.projectId).length}
                  </span>
                </button>

                {/* Areas */}
                {areas.map(area => {
                  const isExpanded = expandedAreas.has(area.id);
                  const areaProjects = getProjectsByArea(area.id);
                  
                  return (
                    <div key={area.id}>
                      <div
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          selectedAreaId === area.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100'
                        }`}
                        onMouseEnter={() => setHoveredAreaId(area.id)}
                        onMouseLeave={() => setHoveredAreaId(null)}
                      >
                        <div className="flex-1 flex items-center gap-2 text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleArea(area.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAreaId(area.id);
                              setSelectedProjectId(null);
                            }}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                          <Circle className="w-3 h-3" style={{ color: area.color }} fill={area.color} />
                          {editingAreaId === area.id ? (
                            <input
                              type="text"
                              value={editingAreaName}
                              onChange={(e) => setEditingAreaName(e.target.value)}
                              onBlur={saveAreaName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveAreaName();
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              className="text-sm font-medium bg-transparent border border-primary-300 rounded px-1 py-0.5 min-w-0 flex-1"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span 
                              className="text-sm font-medium cursor-pointer"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                startEditingArea(area);
                              }}
                              onContextMenu={(e) => handleContextMenu(e, 'area', area.id)}
                            >
                              {area.name}
                            </span>
                          )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 mr-1">{areaProjects.length}</span>
                          {hoveredAreaId === area.id && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedAreaForProject(area.id);
                                  setEditingProject(null);
                                  setIsProjectModalOpen(true);
                                }}
                                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Add Project"
                              >
                                <Plus className="w-3 h-3 text-gray-500" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingArea(area);
                                  setIsAreaModalOpen(true);
                                }}
                                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit Area"
                              >
                                <Edit2 className="w-3 h-3 text-gray-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete the area "${area.name}"? This will also delete all projects and tasks in this area.`)) {
                                    deleteArea(area.id);
                                  }
                                }}
                                className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Area"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="ml-6">
                          <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext items={areaProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                              {areaProjects.map(project => {
                                const taskCount = getTasksByProject(project.id).length;
                                return (
                                  <SortableProject
                                    key={project.id}
                                    project={project}
                                    isSelected={selectedProjectId === project.id}
                                    isEditing={editingProjectId === project.id}
                                    editingName={editingProjectName}
                                    taskCount={taskCount}
                                    isHovered={hoveredProjectId === project.id}
                                    onClick={() => {
                                      setSelectedProjectId(project.id);
                                      setSelectedAreaId(null);
                                      setSelectedView('anytime');
                                    }}
                                    onDoubleClick={() => startEditingProject(project)}
                                    onEditingNameChange={setEditingProjectName}
                                    onSaveEdit={saveProjectName}
                                    onCancelEdit={cancelEditing}
                                    onEditProject={() => {
                                      setEditingProject(project);
                                      setIsProjectModalOpen(true);
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, 'project', project.id)}
                                    onMouseEnter={() => setHoveredProjectId(project.id)}
                                    onMouseLeave={() => setHoveredProjectId(null)}
                                  />
                                );
                              })}
                            </SortableContext>
                            
                            <DragOverlay>
                              {activeProjectId ? (
                                <div className="transform rotate-1 shadow-xl ring-2 ring-primary-300 bg-white rounded-lg">
                                  <div className="flex items-center gap-2 px-3 py-2">
                                    <Folder className="w-3 h-3" />
                                    <span className="text-sm">{projects.find(p => p.id === activeProjectId)?.name}</span>
                                  </div>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                          
                          {areaProjects.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400">
                              No projects yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tags Section - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Tags Header */}
          <div className="px-2 py-2">
            <button
              onClick={() => setShowTags(!showTags)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:bg-gray-100 rounded"
            >
              <span>Tags</span>
              {showTags ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {/* Tags Content */}
          {showTags && (
            <div className="px-2 pb-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Hash className="w-3 h-3" style={{ color: tag.color }} />
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddArea}
              className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add Area"
            >
              <Plus className="w-4 h-4" />
              <span>Add Area</span>
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filter & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => {
          setIsAreaModalOpen(false);
          setEditingArea(null);
        }}
        editingArea={editingArea}
      />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
          setSelectedAreaForProject(null);
        }}
        editingProject={editingProject}
        defaultAreaId={selectedAreaForProject}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => handleContextAction('rename')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
          >
            Rename
          </button>
          <button
            onClick={() => handleContextAction('edit')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => handleContextAction('delete')}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar;