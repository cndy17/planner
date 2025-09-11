import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Project } from '../types';
import TaskList from './TaskList';
import { Plus, Calendar, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectViewProps {
  projectId: string;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projectId }) => {
  const { projects, tasks, updateProject, deleteProject, setIsQuickEntryOpen } = useApp();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  
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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
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
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-6">
        {/* Pending Tasks Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('pending')}
            className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800"
          >
            {collapsedSections.has('pending') ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>To-Do ({pendingTasks.length})</span>
          </button>
          
          {!collapsedSections.has('pending') && (
            <TaskList 
              tasks={pendingTasks} 
              showProject={false}
            />
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => toggleSection('completed')}
              className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800"
            >
              {collapsedSections.has('completed') ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>Completed ({completedTasks.length})</span>
            </button>
            
            {!collapsedSections.has('completed') && (
              <div className="opacity-60">
                <TaskList 
                  tasks={completedTasks} 
                  showProject={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Add Task Button */}
        <button
          onClick={() => setIsQuickEntryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add To-Do</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectView;