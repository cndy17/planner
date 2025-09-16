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
  Repeat
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  level?: number;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showProject = true, level = 0, isDragging = false }) => {
  const { toggleTaskComplete, updateTask, deleteTask, setEditingTaskId, setIsTaskFormOpen, projects } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const project = projects.find(p => p.id === task.projectId);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

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
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { id, ...taskWithoutId } = task;
    updateTask(id, { ...taskWithoutId, title: `${task.title} (copy)` });
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
    <div className={`group ${level > 0 ? `ml-${level * 6}` : ''}`}>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-gray-50 ${getPriorityColor()} ${isDragging ? 'opacity-50' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-primary-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-primary-500 transition-colors" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* Expand button for subtasks */}
            {hasSubtasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-0.5 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}

            <div className="flex-1">
              {/* Title */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="font-medium text-gray-800 bg-transparent border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
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
                  className={`font-medium cursor-pointer hover:text-blue-600 transition-colors px-1 rounded hover:bg-gray-100 ${
                    task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditingTitle();
                  }}
                >
                  {task.title}
                </h3>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {task.flagged && (
                  <Flag className="w-3 h-3 text-orange-500" fill="currentColor" />
                )}
                
                {task.dueDate && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      isPast(new Date(task.dueDate)) && task.status !== 'completed'
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {formatDueDate(new Date(task.dueDate))}
                  </span>
                )}

                {task.reminderTime && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.reminderTime), 'h:mm a')}
                  </span>
                )}

                {task.recurrence && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Repeat className="w-3 h-3" />
                    {task.recurrence}
                  </span>
                )}

                {showProject && project && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {project.name}
                  </span>
                )}

                {task.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    <Hash className="w-3 h-3" />
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* Notes */}
              {task.notes && (
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotes(!showNotes);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showNotes ? 'Hide notes' : 'Show notes'}
                  </button>
                  {showNotes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {task.notes}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
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
            onClick={handleDuplicate}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="ml-8 mt-1">
          {task.subtasks!.map(subtask => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              showProject={false}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;