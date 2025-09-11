import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  Circle,
  Flag
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';

type ViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ isOpen, onClose }) => {
  const { tasks, projects, areas, toggleTaskComplete, setEditingTaskId, setIsTaskFormOpen } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedFilters, setSelectedFilters] = useState({
    showCompleted: true,
    projectIds: [] as string[],
    areaIds: [] as string[],
    priority: [] as string[],
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!selectedFilters.showCompleted && task.status === 'completed') {
        return false;
      }
      if (selectedFilters.projectIds.length > 0 && !selectedFilters.projectIds.includes(task.projectId || '')) {
        return false;
      }
      if (selectedFilters.areaIds.length > 0) {
        const project = projects.find(p => p.id === task.projectId);
        if (!project || !selectedFilters.areaIds.includes(project.areaId || '')) {
          return false;
        }
      }
      if (selectedFilters.priority.length > 0 && !selectedFilters.priority.includes(task.priority || '')) {
        return false;
      }
      return true;
    });
  }, [tasks, projects, selectedFilters]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  // Navigate dates
  const goToPrevious = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render day view
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="space-y-2">
            {hours.map(hour => (
              <div key={hour} className="flex border-t border-gray-200 py-2">
                <div className="w-20 text-sm text-gray-500">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                <div className="flex-1 min-h-[40px]">
                  {dayTasks
                    .filter(task => {
                      if (!task.startDate) return hour === 9; // Default to 9am if no start time
                      const taskHour = new Date(task.startDate).getHours();
                      return taskHour === hour;
                    })
                    .map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Week of {format(weekStart, 'MMMM d, yyyy')}
          </h3>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const dayTasks = getTasksForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 min-h-[150px] ${
                    isToday(day) ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm mb-2">
                    {format(day, 'EEE d')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <TaskItem key={task.id} task={task} compact />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
              <div key={dayName} className="text-center text-sm font-medium text-gray-600">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayTasks = getTasksForDate(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 min-h-[100px] ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday(day) ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <TaskItem key={task.id} task={task} minimal />
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayTasks.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Task item component
  const TaskItem: React.FC<{ task: Task; compact?: boolean; minimal?: boolean }> = ({ 
    task, 
    compact = false,
    minimal = false 
  }) => {
    const handleTaskClick = () => {
      setEditingTaskId(task.id);
      setIsTaskFormOpen(true);
    };

    if (minimal) {
      return (
        <div
          onClick={handleTaskClick}
          className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-gray-50 flex items-center gap-1"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-3 h-3 text-primary-500" />
            ) : (
              <Circle className="w-3 h-3 text-gray-400" />
            )}
          </button>
          <span className={`truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </span>
        </div>
      );
    }

    return (
      <div
        onClick={handleTaskClick}
        className={`${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-primary-500`} />
            ) : (
              <Circle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'} ${compact ? '' : 'font-medium'}`}>
              {task.title}
            </div>
            {!compact && (
              <div className="flex items-center gap-2 mt-1">
                {task.flagged && <Flag className="w-3 h-3 text-orange-500" fill="currentColor" />}
                {task.priority === 'high' && (
                  <span className="text-xs px-1 py-0.5 bg-red-100 text-red-600 rounded">High</span>
                )}
                {task.projectId && (
                  <span className="text-xs text-gray-500">
                    {projects.find(p => p.id === task.projectId)?.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-semibold">Calendar</h2>
            
            {/* View type selector */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as ViewType[]).map(view => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewType === view
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter button */}
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevious}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNext}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filter menu */}
        {showFilterMenu && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFilters.showCompleted}
                  onChange={(e) => setSelectedFilters(prev => ({
                    ...prev,
                    showCompleted: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Show completed</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Priority:</span>
                {['high', 'medium', 'low'].map(priority => (
                  <label key={priority} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedFilters.priority.includes(priority)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            priority: [...prev.priority, priority]
                          }));
                        } else {
                          setSelectedFilters(prev => ({
                            ...prev,
                            priority: prev.priority.filter(p => p !== priority)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar content */}
        {viewType === 'day' && renderDayView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'month' && renderMonthView()}
      </div>
    </div>
  );
};

export default CalendarView;