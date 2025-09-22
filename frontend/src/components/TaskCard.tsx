import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Flag,
  Hash,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Repeat,
  Plus
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  level?: number;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showProject = true, level = 0, isDragging = false }) => {
  const { toggleTaskComplete, updateTask, deleteTask, setEditingTaskId, setIsTaskFormOpen, projects, addTask, tasks } = useApp();
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const project = projects.find(p => p.id === task.projectId);

  // Dynamically find subtasks from all tasks
  const subtasks = tasks.filter(t => t.parentTaskId === task.id);
  const hasSubtasks = subtasks.length > 0;

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'text-red-500 border-red-200 bg-red-50';
      case 'medium':
        return 'text-yellow-500 border-yellow-200 bg-yellow-50';
      case 'low':
        return 'text-blue-500 border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200';
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setIsTaskFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = hasSubtasks
      ? `Are you sure you want to delete this task and its ${subtasks.length} subtask${subtasks.length === 1 ? '' : 's'}?`
      : 'Are you sure you want to delete this task?';

    if (window.confirm(message)) {
      deleteTask(task.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { id, ...taskWithoutId } = task;
    updateTask(id, { ...taskWithoutId, title: `${task.title} (copy)` });
  };

  const handleAddSubtask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addTask({
      title: 'New subtask',
      status: 'pending',
      parentTaskId: task.id,
      projectId: task.projectId,
      sectionId: task.sectionId,
      flagged: false,
      tags: [],
      order: subtasks.length
    });
    // Expand to show the new subtask
    setIsExpanded(true);
  };

  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setEditingTitle(task.title);
  };

  const saveTitle = async () => {
    if (editingTitle.trim()) {
      await updateTask(task.id, { title: editingTitle.trim() });
      setIsEditingTitle(false);
      setEditingTitle('');
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  return (
    <div className={`group ${level > 0 ? 'ml-8' : ''}`}>
      <div
        className={`flex items-start gap-1 py-1 px-1 transition-all hover:bg-gray-50 ${isDragging ? 'opacity-50' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className="mt-0.5 flex-shrink-0 hover:scale-105 transition-transform"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-0.5">
            {/* Arrow button - shows on hover for all tasks */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`mt-0.5 flex-shrink-0 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <div className="flex-1">
              {/* Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="text-sm font-normal text-gray-800 bg-transparent border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                autoFocus
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveTitle();
                  } else if (e.key === 'Escape') {
                    cancelEditingTitle();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3
                className={`text-sm font-normal cursor-pointer hover:text-blue-600 transition-colors px-1 py-0.5 rounded hover:bg-gray-100 ${
                  task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditingTitle();
                }}
              >
                {task.title}
              </h3>
            )}

              {/* Date information */}
              {(task.dueDate || task.startDate || task.reminderTime || task.plannedDate) && (
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {task.plannedDate && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Hash className="w-3 h-3" />
                      <span>Planned {formatDueDate(new Date(task.plannedDate))}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 ${isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'text-red-500' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      <span>Due {formatDueDate(new Date(task.dueDate))}</span>
                    </div>
                  )}
                  {task.startDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Start {formatDueDate(new Date(task.startDate))}</span>
                    </div>
                  )}
                  {task.reminderTime && (
                    <div className="flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      <span>Reminder {format(new Date(task.reminderTime), 'MMM d, h:mm a')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden metadata - can be shown on hover or in detailed view */}
              <div className="hidden">
                {task.flagged && <Flag className="w-3 h-3 text-orange-500" fill="currentColor" />}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Subtasks - shown when expanded */}
      {isExpanded && (
        <div className="mt-1">
          {/* Existing subtasks */}
          {hasSubtasks && subtasks.map(subtask => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              showProject={false}
              level={level + 1}
            />
          ))}

          {/* Add subtask row - aligned with subtask indentation */}
          <div className="ml-8 mt-1">
            <button
              onClick={handleAddSubtask}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add subtask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;