import React, { useState } from 'react';
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
  Edit2
} from 'lucide-react';
import { ViewType, Area, Project } from '../types';
import AreaModal from './modals/AreaModal';
import ProjectModal from './modals/ProjectModal';

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
    deleteProject
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

  const toggleArea = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const viewItems: { view: ViewType; icon: React.ReactNode; label: string }[] = [
    { view: 'today', icon: <Calendar className="w-4 h-4" />, label: 'Today' },
    { view: 'upcoming', icon: <CalendarDays className="w-4 h-4" />, label: 'Upcoming' },
    { view: 'anytime', icon: <Clock className="w-4 h-4" />, label: 'Anytime' },
    { view: 'someday', icon: <Archive className="w-4 h-4" />, label: 'Someday' },
    { view: 'logbook', icon: <Archive className="w-4 h-4" />, label: 'Logbook' },
  ];

  return (
    <>
      <div className="w-64 bg-gray-50 h-full flex flex-col border-r border-gray-200">
        {/* Quick Entry Button */}
        <div className="p-4">
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New To-Do</span>
          </button>
        </div>

        {/* Views */}
        <div className="px-2 py-2">
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

        <div className="flex-1 overflow-y-auto">
          {/* Areas & Projects */}
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
            
            {showAreas && (
              <div className="mt-1">
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
                        <button
                          onClick={() => {
                            toggleArea(area.id);
                            setSelectedAreaId(area.id);
                            setSelectedProjectId(null);
                          }}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <Circle className="w-3 h-3" style={{ color: area.color }} fill={area.color} />
                          <span className="text-sm font-medium">{area.name}</span>
                        </button>
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
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="ml-6">
                          {areaProjects.map(project => {
                            const taskCount = getTasksByProject(project.id).length;
                            return (
                              <div
                                key={project.id}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                                  selectedProjectId === project.id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'hover:bg-gray-100'
                                }`}
                                onMouseEnter={() => setHoveredProjectId(project.id)}
                                onMouseLeave={() => setHoveredProjectId(null)}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedProjectId(project.id);
                                    setSelectedAreaId(null);
                                    setSelectedView('anytime');
                                  }}
                                  className="flex-1 flex items-center gap-2 text-left"
                                >
                                  <Folder className="w-3 h-3" />
                                  <span className="text-sm">{project.name}</span>
                                </button>
                                <div className="flex items-center gap-1">
                                  {taskCount > 0 && (
                                    <span className="text-xs text-gray-500">{taskCount}</span>
                                  )}
                                  {hoveredProjectId === project.id && (
                                    <button
                                      onClick={() => {
                                        setEditingProject(project);
                                        setIsProjectModalOpen(true);
                                      }}
                                      className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Edit Project"
                                    >
                                      <Edit2 className="w-3 h-3 text-gray-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
            )}
          </div>

          {/* Tags */}
          <div className="px-2 py-2 border-t border-gray-200">
            <button
              onClick={() => setShowTags(!showTags)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:bg-gray-100 rounded"
            >
              <span>Tags</span>
              {showTags ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            
            {showTags && (
              <div className="mt-1">
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
            )}
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
    </>
  );
};

export default Sidebar;