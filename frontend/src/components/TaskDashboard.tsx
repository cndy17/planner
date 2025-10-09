import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TaskFilter, TaskType } from '../types';
import TaskListSimple from './TaskListSimple';
import {
  Square,
  TrendingUp,
  CheckCircle2,
  List,
  BarChart3,
  Filter,
  Clock,
  Send,
  ChevronDown,
  FolderOpen
} from 'lucide-react';

interface TaskDashboardProps {
  hideCompletedTasks?: boolean;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({
  hideCompletedTasks = false
}) => {
  const { tasks, projects, addTask } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [quickEntryText, setQuickEntryText] = useState('');
  const [quickEntryType, setQuickEntryType] = useState<TaskType>('task');
  const [quickEntryProject, setQuickEntryProject] = useState<string>('');

  // Calculate task statistics and previews across all projects
  const taskStats = useMemo(() => {
    const allTasks = tasks;
    const pendingTasks = allTasks.filter(t => t.status === 'pending');

    // Task type breakdown (pending only)
    const updateTasks = pendingTasks.filter(t => t.taskType === 'update');
    const actionTasks = pendingTasks.filter(t => t.taskType === 'action');
    const nextStepTasks = pendingTasks.filter(t => t.taskType === 'next-step');
    const regularTasks = pendingTasks.filter(t => t.taskType === 'task');

    // Get recent tasks for previews (different amounts to balance heights)
    const recentUpdates = updateTasks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
    const recentActions = actionTasks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
    const recentNextSteps = nextStepTasks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);
    const recentTasks = regularTasks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);

    return {
      total: allTasks.length,
      pending: pendingTasks.length,
      updates: updateTasks.length,
      actions: actionTasks.length,
      nextSteps: nextStepTasks.length,
      tasks: regularTasks.length,
      activeProjects: Array.from(new Set(pendingTasks.map(t => t.projectId).filter(Boolean))).length,
      previews: {
        updates: recentUpdates,
        actions: recentActions,
        nextSteps: recentNextSteps,
        tasks: recentTasks
      }
    };
  }, [tasks]);

  // Filter tasks for display
  const filteredTasks = useMemo(() => {
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    if (selectedFilter === 'all') return pendingTasks;

    const typeMap: Record<string, TaskType> = {
      'updates': 'update',
      'actions': 'action',
      'next-steps': 'next-step',
      'tasks': 'task'
    };

    const targetType = typeMap[selectedFilter];
    return pendingTasks.filter(task => task.taskType === targetType);
  }, [tasks, selectedFilter]);

  // Statistics cards configuration (keeping only core task type stats)
  const statCards = [
    {
      label: 'Tasks',
      value: taskStats.tasks,
      icon: Square,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      clickable: true,
      filter: 'tasks' as TaskFilter
    },
    {
      label: 'Updates',
      value: taskStats.updates,
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      clickable: true,
      filter: 'updates' as TaskFilter
    },
    {
      label: 'Actions',
      value: taskStats.actions,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      clickable: true,
      filter: 'actions' as TaskFilter
    },
    {
      label: 'Next Steps',
      value: taskStats.nextSteps,
      icon: List,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      clickable: true,
      filter: 'next-steps' as TaskFilter
    },
    {
      label: 'Total Tasks',
      value: taskStats.total,
      subValue: `${taskStats.pending} active`,
      icon: BarChart3,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Active Projects',
      value: taskStats.activeProjects,
      icon: FolderOpen,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    }
  ];

  // Filter buttons configuration
  const filterButtons = [
    { filter: 'all' as TaskFilter, label: 'All Tasks', count: taskStats.pending },
    { filter: 'updates' as TaskFilter, label: 'Updates', count: taskStats.updates, color: 'blue' },
    { filter: 'actions' as TaskFilter, label: 'Actions', count: taskStats.actions, color: 'green' },
    { filter: 'next-steps' as TaskFilter, label: 'Next Steps', count: taskStats.nextSteps, color: 'purple' },
    { filter: 'tasks' as TaskFilter, label: 'Tasks', count: taskStats.tasks, color: 'gray' }
  ];

  const handleCardClick = (filter?: TaskFilter) => {
    if (filter) {
      setSelectedFilter(filter);
    }
  };

  const handleQuickEntrySubmit = async () => {
    if (!quickEntryText.trim()) return;

    try {
      await addTask({
        title: quickEntryText.trim(),
        taskType: quickEntryType,
        projectId: quickEntryProject || null,
        status: 'pending',
        flagged: false,
        tags: [],
        order: Date.now()
      });

      setQuickEntryText('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleQuickEntryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickEntrySubmit();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Dashboard</h1>
          <p className="text-gray-600">Overview of all your tasks across projects</p>
        </div>

        {/* Statistics Cards Grid with Quick Entry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* First Row: Tasks, Updates, Actions, Next Steps */}
          {statCards.slice(0, 4).map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${card.borderColor} ${card.bgColor} ${
                  card.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={() => card.clickable && handleCardClick(card.filter)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                  <span className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </span>
                </div>
                <div className="text-sm">
                  <p className={`font-medium ${card.textColor}`}>{card.label}</p>
                  {card.subValue && (
                    <p className="text-gray-500 text-xs mt-1">{card.subValue}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Second Row: Total Tasks, Quick Entry (spans 2), Active Projects */}
          {/* Total Tasks Card */}
          <div className={`p-4 rounded-lg border ${statCards[4].borderColor} ${statCards[4].bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className={`w-5 h-5 ${statCards[4].textColor}`} />
              <span className={`text-2xl font-bold ${statCards[4].textColor}`}>
                {statCards[4].value}
              </span>
            </div>
            <div className="text-sm">
              <p className={`font-medium ${statCards[4].textColor}`}>{statCards[4].label}</p>
              {statCards[4].subValue && (
                <p className="text-gray-500 text-xs mt-1">{statCards[4].subValue}</p>
              )}
            </div>
          </div>

          {/* Quick Entry Card - spans 2 columns */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quick Entry</h3>

              {/* Task Type Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => setQuickEntryType('task')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    quickEntryType === 'task'
                      ? 'bg-gray-100 text-gray-700 border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  Task
                </button>
                <button
                  onClick={() => setQuickEntryType('update')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    quickEntryType === 'update'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Update
                </button>
                <button
                  onClick={() => setQuickEntryType('action')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    quickEntryType === 'action'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-500 hover:text-green-600'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Action
                </button>
                <button
                  onClick={() => setQuickEntryType('next-step')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    quickEntryType === 'next-step'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'text-gray-500 hover:text-purple-600'
                  }`}
                >
                  <List className="w-3 h-3" />
                  Next
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Project Selector */}
              <select
                value={quickEntryProject}
                onChange={(e) => setQuickEntryProject(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm flex-shrink-0 min-w-32"
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Text Input */}
              <input
                type="text"
                placeholder={`Enter ${quickEntryType === 'next-step' ? 'next step' : quickEntryType}...`}
                value={quickEntryText}
                onChange={(e) => setQuickEntryText(e.target.value)}
                onKeyDown={handleQuickEntryKeyDown}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm placeholder-gray-500"
              />

              {/* Submit Button */}
              <button
                onClick={handleQuickEntrySubmit}
                disabled={!quickEntryText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Active Projects Card */}
          <div className={`p-4 rounded-lg border ${statCards[5].borderColor} ${statCards[5].bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <FolderOpen className={`w-5 h-5 ${statCards[5].textColor}`} />
              <span className={`text-2xl font-bold ${statCards[5].textColor}`}>
                {statCards[5].value}
              </span>
            </div>
            <div className="text-sm">
              <p className={`font-medium ${statCards[5].textColor}`}>{statCards[5].label}</p>
            </div>
          </div>
        </div>

        {/* Task Previews */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Updates Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recent Updates ({taskStats.updates})
              </h3>
              <button
                onClick={() => setSelectedFilter('updates')}
                className="text-xs text-gray-500 hover:text-blue-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {taskStats.previews.updates.length > 0 ? (
                taskStats.previews.updates.map(task => (
                  <div key={task.id} className="text-sm text-gray-700 line-clamp-1">
                    {task.title}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No recent updates</div>
              )}
            </div>
          </div>

          {/* Actions Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recent Actions ({taskStats.actions})
              </h3>
              <button
                onClick={() => setSelectedFilter('actions')}
                className="text-xs text-gray-500 hover:text-green-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {taskStats.previews.actions.length > 0 ? (
                taskStats.previews.actions.map(task => (
                  <div key={task.id} className="text-sm text-gray-700 line-clamp-1">
                    {task.title}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No recent actions</div>
              )}
            </div>
          </div>

          {/* Next Steps Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                <List className="w-4 h-4" />
                Recent Next Steps ({taskStats.nextSteps})
              </h3>
              <button
                onClick={() => setSelectedFilter('next-steps')}
                className="text-xs text-gray-500 hover:text-purple-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {taskStats.previews.nextSteps.length > 0 ? (
                taskStats.previews.nextSteps.map(task => (
                  <div key={task.id} className="text-sm text-gray-700 line-clamp-1">
                    {task.title}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No recent next steps</div>
              )}
            </div>
          </div>

          {/* Tasks Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Square className="w-4 h-4" />
                Recent Tasks ({taskStats.tasks})
              </h3>
              <button
                onClick={() => setSelectedFilter('tasks')}
                className="text-xs text-gray-500 hover:text-gray-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {taskStats.previews.tasks.length > 0 ? (
                taskStats.previews.tasks.map(task => (
                  <div key={task.id} className="text-sm text-gray-700 line-clamp-1">
                    {task.title}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No recent tasks</div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Menu */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter Tasks</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterButtons.map(({ filter, label, count, color = 'gray' }) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? color === 'blue' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                    : color === 'green' ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                    : color === 'purple' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                    : 'bg-gray-100 text-gray-700 ring-2 ring-gray-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label} {count > 0 && `(${count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFilter === 'all' ? 'All Active Tasks' :
               selectedFilter === 'updates' ? 'Update Tasks' :
               selectedFilter === 'actions' ? 'Action Tasks' :
               selectedFilter === 'next-steps' ? 'Next Step Tasks' :
               'Regular Tasks'} ({filteredTasks.length})
            </h2>
          </div>

          <div className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No tasks found</p>
                <p className="text-sm">
                  {selectedFilter === 'all'
                    ? "You don't have any active tasks right now."
                    : `No ${selectedFilter.replace('-', ' ')} tasks at the moment.`
                  }
                </p>
              </div>
            ) : (
              <TaskListSimple
                tasks={filteredTasks}
                onReorder={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;