import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import SectionedTaskView from './SectionedTaskView';
import TaskList from './TaskList';
import NotesPanel from './NotesPanel';
import { Plus, Calendar, MoreVertical, Clock, X, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ProjectModal from './modals/ProjectModal';

interface ProjectViewProps {
  projectId: string;
  hideCompletedTasks?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projectId, hideCompletedTasks = false }) => {
  const { projects, tasks, areas, updateProject, deleteProject, updateTask, addTask, reorderTasks, getSectionsByProject } = useApp();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskSectionId, setNewTaskSectionId] = useState('');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const area = project?.areaId ? areas.find(a => a.id === project.areaId) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectDropdown]);
  
  if (!project) {
    return <div className="p-4">Project not found</div>;
  }

  const completedTasks = projectTasks.filter(t => t.status === 'completed');
  const pendingTasks = projectTasks.filter(t => t.status === 'pending');
  const completionPercentage = projectTasks.length > 0 
    ? Math.round((completedTasks.length / projectTasks.length) * 100)
    : 0;

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };


  const startEditingProjectName = () => {
    setIsEditingProjectName(true);
    setEditingProjectName(project?.name || '');
  };

  const saveProjectName = async () => {
    if (editingProjectName.trim() && project) {
      await updateProject(project.id, { name: editingProjectName.trim() });
      setIsEditingProjectName(false);
      setEditingProjectName('');
    }
  };

  const cancelEditingProjectName = () => {
    setIsEditingProjectName(false);
    setEditingProjectName('');
  };

  const startEditingDescription = () => {
    setIsEditingDescription(true);
    setEditingDescription(project?.description || '');
  };

  const saveDescription = async () => {
    if (project) {
      await updateProject(project.id, { description: editingDescription.trim() || null });
      setIsEditingDescription(false);
      setEditingDescription('');
    }
  };

  const cancelEditingDescription = () => {
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  const startAddingTask = () => {
    setIsAddingTask(true);
  };

  const saveNewTask = async () => {
    if (newTaskTitle.trim()) {
      let dueDate = null;
      if (newTaskDueDate) {
        dueDate = new Date(newTaskDueDate);
        if (newTaskDueTime) {
          const [hours, minutes] = newTaskDueTime.split(':');
          dueDate.setHours(parseInt(hours), parseInt(minutes));
        }
      }

      await addTask({
        title: newTaskTitle.trim(),
        projectId: projectId,
        sectionId: newTaskSectionId || null,
        status: 'pending',
        dueDate: dueDate,
        notes: undefined,
        priority: null,
        flagged: false,
        tags: [],
        reminderTime: null,
        recurrence: null,
        order: pendingTasks.length,
        subtasks: []
      });

      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskDueTime('');
      setNewTaskSectionId('');
      setIsAddingTask(false);
      setShowDateTimePicker(false);
    }
  };

  const cancelAddingTask = () => {
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskDueTime('');
    setNewTaskSectionId('');
    setIsAddingTask(false);
    setShowDateTimePicker(false);
  };

  const handleEditProject = () => {
    setIsProjectModalOpen(true);
    setShowProjectDropdown(false);
  };

  const handleDeleteProject = async () => {
    if (window.confirm(`Are you sure you want to delete the project "${project?.name}"? This will also delete all tasks in this project.`)) {
      await deleteProject(projectId);
      setShowProjectDropdown(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingProjectName ? (
                <input
                  type="text"
                  value={editingProjectName}
                  onChange={(e) => setEditingProjectName(e.target.value)}
                  className="text-2xl font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 w-full"
                  autoFocus
                  onBlur={saveProjectName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveProjectName();
                    } else if (e.key === 'Escape') {
                      cancelEditingProjectName();
                    }
                  }}
                />
              ) : (
                <h2
                  className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors px-1 rounded hover:bg-gray-100"
                  onDoubleClick={startEditingProjectName}
                >
                  {project.name}
                </h2>
              )}

              {isEditingDescription ? (
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="mt-2 text-gray-600 bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none"
                  rows={2}
                  autoFocus
                  onBlur={saveDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveDescription();
                    } else if (e.key === 'Escape') {
                      cancelEditingDescription();
                    }
                  }}
                  placeholder="Add a description..."
                />
              ) : (
                <p
                  className="mt-2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors px-1 rounded hover:bg-gray-100 min-h-[1.5rem]"
                  onDoubleClick={startEditingDescription}
                >
                  {project.description || 'Add a description...'}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4">
                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">
                    {completedTasks.length} of {projectTasks.length} tasks completed
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Project Actions Dropdown */}
            <div className="relative" ref={projectDropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProjectDropdown(!showProjectDropdown);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              {/* Project Dropdown Menu */}
              {showProjectDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditProject();
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
                      handleDeleteProject();
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

        {/* Tasks with Sections */}
        <div className="p-6">
          <SectionedTaskView projectId={projectId} hideCompletedTasks={hideCompletedTasks} />

          {/* Add Task Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {isAddingTask ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Task Title Input */}
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveNewTask();
                    } else if (e.key === 'Escape') {
                      cancelAddingTask();
                    }
                  }}
                />

                {/* Date/Time Controls */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setShowDateTimePicker(!showDateTimePicker)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                      showDateTimePicker || newTaskDueDate
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {newTaskDueDate ? format(new Date(newTaskDueDate), 'MMM d') : 'Due Date'}
                    </span>
                  </button>

                  {newTaskDueDate && (
                    <button
                      onClick={() => {
                        setNewTaskDueDate('');
                        setNewTaskDueTime('');
                        setShowDateTimePicker(false);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Remove due date"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Date/Time Picker */}
                {showDateTimePicker && (
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time (optional)</label>
                        <input
                          type="time"
                          value={newTaskDueTime}
                          onChange={(e) => setNewTaskDueTime(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Selector */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Section (optional)</label>
                  <select
                    value={newTaskSectionId}
                    onChange={(e) => setNewTaskSectionId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No Section</option>
                    {getSectionsByProject(projectId).map(section => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={saveNewTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={cancelAddingTask}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={startAddingTask}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Modal */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
          }}
          editingProject={project}
        />
      </div>

      {/* Notes Panel */}
      <NotesPanel projectId={projectId} />
    </div>
  );
};

export default ProjectView;