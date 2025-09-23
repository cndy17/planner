import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task } from '../types';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { format, addDays, subDays, isSameDay, isToday, isPast, isTomorrow } from 'date-fns';
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DailyPlannerViewProps {
  hideCompletedTasks?: boolean;
}

interface SortableTaskCardProps {
  task: Task;
  showScheduleButton?: boolean;
  onScheduleClick?: (task: Task) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  showScheduleButton = false,
  onScheduleClick
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <TaskCard task={task} isDragging={isDragging} />
      </div>
      {showScheduleButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onScheduleClick?.(task);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all"
          title="Schedule task"
        >
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

interface UnscheduledTasksColumnProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onScheduleTask: (task: Task) => void;
  hideCompletedTasks?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const UnscheduledTasksColumn: React.FC<UnscheduledTasksColumnProps> = ({
  tasks,
  searchQuery,
  onSearchChange,
  onScheduleTask,
  hideCompletedTasks = false,
  isCollapsed,
  onToggleCollapse
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unscheduled-column',
  });

  const filteredTasks = tasks.filter(task => {
    // Filter by completed status
    if (hideCompletedTasks && task.status === 'completed') {
      return false;
    }
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query) || false;
      const notesMatch = task.notes?.toLowerCase().includes(query) || false;
      if (!titleMatch && !notesMatch) {
        return false;
      }
    }
    return true;
  });

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-2"
          title="Expand unscheduled tasks"
        >
          <PanelLeftOpen className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap mt-4">
          {filteredTasks.length} tasks
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200">
      <div className="bg-gray-100 p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-700">
            Unscheduled Tasks
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">
              {filteredTasks.length}
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 min-h-96 max-h-[calc(100vh-200px)] transition-colors ${
          isOver ? 'bg-blue-50 border-blue-300' : ''
        }`}
      >
        <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                showScheduleButton={true}
                onScheduleClick={onScheduleTask}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No tasks match your search</p>
                    <button
                      onClick={() => onSearchChange('')}
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">All tasks are scheduled!</p>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  isToday?: boolean;
  onAddTask: (date: Date) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  tasks,
  isToday = false,
  onAddTask
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
  });

  const displayTasks = tasks.filter(task => {
    if (task.plannedDate) {
      // Ensure we're working with a proper Date object
      const plannedDate = new Date(task.plannedDate);
      // Check if the date is valid
      if (isNaN(plannedDate.getTime())) {
        console.warn('DayColumn: Invalid plannedDate for task:', task.id, task.plannedDate);
        return false;
      }
      const matches = isSameDay(plannedDate, date);
      if (matches) {
        console.log('DayColumn: Task', task.title, 'matches date', format(date, 'yyyy-MM-dd'), 'planned:', format(plannedDate, 'yyyy-MM-dd'));
      }
      return matches;
    }
    // For today's column, also show tasks due today
    if (isToday && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (isNaN(dueDate.getTime())) {
        console.warn('DayColumn: Invalid dueDate for task:', task.id, task.dueDate);
        return false;
      }
      return isSameDay(dueDate, date);
    }
    return false;
  });

  // Debug log for empty columns (only when there are tasks with planned dates to avoid spam)
  if (displayTasks.length === 0 && tasks.some(t => t.plannedDate)) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tasksWithPlannedDates = tasks.filter(t => t.plannedDate).map(t => ({
      title: t.title,
      plannedDate: t.plannedDate ? format(new Date(t.plannedDate), 'yyyy-MM-dd') : 'none'
    }));
    console.log(`DayColumn ${dateStr}: No tasks displayed. Tasks with planned dates:`, tasksWithPlannedDates);
  }

  const formatDateHeader = (date: Date) => {
    if (isToday) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getDateStyle = () => {
    if (isToday) return 'bg-blue-500 text-white';
    if (isPast(date)) return 'bg-gray-100 text-gray-600';
    return 'bg-gray-50 text-gray-800';
  };

  return (
    <div className="h-full w-full border-r border-gray-200 bg-white">
      <div className={`${getDateStyle()} p-3 border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {formatDateHeader(date)}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full">
              {displayTasks.length}
            </span>
            <button
              onClick={() => onAddTask(date)}
              className="p-1 hover:bg-black hover:bg-opacity-20 rounded transition-colors"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`bg-white border-l border-r border-gray-200 h-[calc(100vh-280px)] p-3 transition-colors overflow-y-auto ${
          isOver ? 'bg-blue-50 border-blue-300' : ''
        }`}
      >
        <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {displayTasks.map(task => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {displayTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-2">No tasks planned</p>
                <button
                  onClick={() => onAddTask(date)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Add a task
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg p-2">
        <button
          onClick={() => onAddTask(date)}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add task for {format(date, 'MMM d')}
        </button>
      </div>
    </div>
  );
};

const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({ hideCompletedTasks: initialHideCompleted = false }) => {
  const { tasks, updateTask, addTask, setIsQuickEntryOpen } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTaskForScheduling, setSelectedTaskForScheduling] = useState<Task | null>(null);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(initialHideCompleted);
  const [quickFind, setQuickFind] = useState('');
  const [isUnscheduledCollapsed, setIsUnscheduledCollapsed] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  // Generate days to show (5 days by default, 7 days when expanded)
  const numberOfDays = showAllDays ? 7 : 5;
  const days = Array.from({ length: numberOfDays }, (_, i) => addDays(currentDate, i));

  // Get unscheduled tasks (no plannedDate and no dueDate)
  const getUnscheduledTasks = (): Task[] => {
    return tasks.filter(task => {
      if (hideCompletedTasks && task.status === 'completed') return false;
      return !task.plannedDate && !task.dueDate && task.status !== 'completed';
    });
  };

  // Get tasks with overdue dates that need rescheduling
  const getOverdueTasks = (): Task[] => {
    return tasks.filter(task => {
      if (hideCompletedTasks && task.status === 'completed') return false;
      if (task.status === 'completed') return false;

      // Check if due date is in the past
      if (task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) {
        return true;
      }

      // Check if planned date is in the past
      if (task.plannedDate && isPast(new Date(task.plannedDate)) && !isToday(new Date(task.plannedDate))) {
        return true;
      }

      return false;
    });
  };

  const handleScheduleTask = (task: Task) => {
    setSelectedTaskForScheduling(task);
    setShowDatePicker(true);
  };

  const handleDateSelect = async (selectedDate: string) => {
    if (selectedTaskForScheduling) {
      await updateTask(selectedTaskForScheduling.id, {
        plannedDate: new Date(selectedDate)
      });
      setSelectedTaskForScheduling(null);
      setShowDatePicker(false);
    }
  };

  const handleAddTask = async (plannedDate: Date) => {
    await addTask({
      title: 'New task',
      status: 'pending',
      plannedDate: plannedDate,
      flagged: false,
      tags: [],
      order: 0
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    console.log('DailyPlanner: Drag started for task:', taskId);
    setActiveId(taskId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      console.log('DailyPlanner: No drop target');
      return;
    }

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('DailyPlanner: Task not found for ID:', taskId);
      return;
    }

    console.log('DailyPlanner: Drag ended - Task:', task.title, 'Drop target:', over.id, 'Type:', typeof over.id);

    // Debug: Show all available droppable IDs for context
    console.log('DailyPlanner: Available drop zones:');
    console.log('  - unscheduled-column');
    days.forEach((day, index) => {
      const dayId = format(day, 'yyyy-MM-dd');
      const dayName = index === 0 && isToday(day) ? 'Today' :
                     index === 1 && isTomorrow(day) ? 'Tomorrow' :
                     format(day, 'EEE MMM d');
      console.log(`  - ${dayId} (${dayName})`);
    });

    // If dropped on unscheduled column
    if (over.id === 'unscheduled-column') {
      console.log('DailyPlanner: Clearing planned date for task:', task.title);
      try {
        await updateTask(taskId, { plannedDate: null });
        console.log('DailyPlanner: Successfully cleared planned date');
      } catch (error) {
        console.error('DailyPlanner: Failed to clear planned date:', error);
      }
      return;
    }

    const dropTargetId = over.id as string;

    // Check if dropped on a date column (yyyy-MM-dd format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dropTargetId)) {
      console.log('DailyPlanner: Dropped on date column:', dropTargetId);

      // Debug: Show current date context
      const actualToday = new Date();
      const actualTomorrow = addDays(actualToday, 1);
      console.log('DailyPlanner: Actual today:', format(actualToday, 'yyyy-MM-dd'));
      console.log('DailyPlanner: Actual tomorrow:', format(actualTomorrow, 'yyyy-MM-dd'));
      console.log('DailyPlanner: Current view date:', format(currentDate, 'yyyy-MM-dd'));
      console.log('DailyPlanner: Days array:', days.map(d => format(d, 'yyyy-MM-dd')));

      const newPlannedDate = new Date(dropTargetId + 'T00:00:00');

      if (isNaN(newPlannedDate.getTime())) {
        console.error('DailyPlanner: Invalid date created from:', dropTargetId);
        return;
      }

      console.log('DailyPlanner: Setting planned date for task:', task.title, 'from', task.plannedDate, 'to:', newPlannedDate.toISOString());

      try {
        await updateTask(taskId, { plannedDate: newPlannedDate });
        console.log('DailyPlanner: Successfully updated task planned date');
      } catch (error) {
        console.error('DailyPlanner: Failed to update task:', error);
      }
      return;
    }

    // Check if dropped on another task (UUID format) - this means reordering within a day
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(dropTargetId)) {
      console.log('DailyPlanner: Dropped on another task (reordering):', dropTargetId);

      // Find the target task to get its planned date
      const targetTask = tasks.find(t => t.id === dropTargetId);
      console.log('DailyPlanner: Found target task:', targetTask ? targetTask.title : 'NOT FOUND');
      console.log('DailyPlanner: Target task plannedDate:', targetTask?.plannedDate);
      console.log('DailyPlanner: Target task dueDate:', targetTask?.dueDate);
      if (targetTask && targetTask.plannedDate) {
        console.log('DailyPlanner: Moving task to same day as target task:', targetTask.plannedDate);

        try {
          await updateTask(taskId, { plannedDate: new Date(targetTask.plannedDate) });
          console.log('DailyPlanner: Successfully moved task to same day');
        } catch (error) {
          console.error('DailyPlanner: Failed to move task:', error);
        }
      } else if (targetTask && !targetTask.plannedDate) {
        // Check if target task has a due date for today - if so, set planned date to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('DailyPlanner: Target task has no plannedDate:', targetTask.title);
        console.log('DailyPlanner: Target task dueDate:', targetTask.dueDate);
        console.log('DailyPlanner: Today date for comparison:', today.toISOString());

        if (targetTask.dueDate) {
          const targetDueDate = new Date(targetTask.dueDate);
          const isTodayMatch = isSameDay(targetDueDate, today);
          console.log('DailyPlanner: Due date comparison - targetDueDate:', targetDueDate.toISOString(), 'isToday:', isTodayMatch);

          if (isTodayMatch) {
            console.log('DailyPlanner: Target task due today, setting planned date to today');
            try {
              await updateTask(taskId, { plannedDate: today });
              console.log('DailyPlanner: Successfully set planned date to today');
            } catch (error) {
              console.error('DailyPlanner: Failed to set planned date to today:', error);
            }
            return;
          }
        }

        // Target task is in unscheduled column, so move this task there too
        console.log('DailyPlanner: Target task is unscheduled, clearing planned date');
        try {
          await updateTask(taskId, { plannedDate: null });
          console.log('DailyPlanner: Successfully cleared planned date');
        } catch (error) {
          console.error('DailyPlanner: Failed to clear planned date:', error);
        }
      } else {
        console.log('DailyPlanner: Target task not found, ignoring drop');
      }
      return;
    }

    // If we get here, it's an unknown drop target
    console.warn('DailyPlanner: Unknown drop target format:', dropTargetId, 'Length:', dropTargetId.length, 'Contains dash:', dropTargetId.includes('-'));
    console.log('DailyPlanner: Available drop zones should be:', [
      'unscheduled-column',
      'Date format (yyyy-MM-dd): e.g., 2025-09-23',
      'Task UUIDs: e.g., 36 char strings with dashes'
    ]);
  };

  const moveOverdueTasksToToday = async () => {
    const overdueTasks = getOverdueTasks();
    const today = new Date();

    for (const task of overdueTasks) {
      await updateTask(task.id, {
        plannedDate: today,
        // Clear old due date if it was overdue
        dueDate: task.dueDate && isPast(new Date(task.dueDate)) ? null : task.dueDate
      });
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : subDays(currentDate, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const unscheduledTasks = getUnscheduledTasks();
  const overdueTasks = getOverdueTasks();
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  const allTasks = tasks.filter(task => {
    if (hideCompletedTasks && task.status === 'completed') return false;
    if (quickFind) {
      const query = quickFind.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query) || false;
      const notesMatch = task.notes?.toLowerCase().includes(query) || false;
      if (!titleMatch && !notesMatch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Main Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Daily Planner</h1>

            {/* Overdue Tasks Indicator */}
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  {overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={moveOverdueTasksToToday}
                  className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
                >
                  Move to Today
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Menu Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="p-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Week Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-800">
                    {format(currentDate, 'MMM d')} - {format(addDays(currentDate, 6), 'MMM d, yyyy')}
                  </h2>
                </div>

                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Today
              </button>

              {/* Days Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setShowAllDays(false)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    !showAllDays
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  5 Days
                </button>
                <button
                  onClick={() => setShowAllDays(true)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    showAllDays
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  7 Days
                </button>
              </div>
            </div>

            {/* Right Side - Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Find */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={quickFind}
                  onChange={(e) => setQuickFind(e.target.value)}
                  placeholder="Quick find..."
                  className="pl-10 pr-8 py-1.5 w-48 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {quickFind && (
                  <button
                    onClick={() => setQuickFind('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Hide Completed Toggle */}
              <button
                onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  hideCompletedTasks
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={hideCompletedTasks ? 'Show completed tasks' : 'Hide completed tasks'}
              >
                {hideCompletedTasks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {hideCompletedTasks ? 'Hidden' : 'Show All'}
                </span>
              </button>

              {/* New Task */}
              <button
                onClick={() => setIsQuickEntryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Unscheduled Tasks Column */}
          <UnscheduledTasksColumn
            tasks={[...unscheduledTasks, ...overdueTasks]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onScheduleTask={handleScheduleTask}
            hideCompletedTasks={hideCompletedTasks}
            isCollapsed={isUnscheduledCollapsed}
            onToggleCollapse={() => setIsUnscheduledCollapsed(!isUnscheduledCollapsed)}
          />

          {/* Daily Columns - Responsive Layout */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full min-w-max">
              {days.map((day, index) => (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className="flex-shrink-0"
                  style={{
                    width: isUnscheduledCollapsed
                      ? `calc((100vw - 48px) / ${Math.min(numberOfDays, 5)})`
                      : `calc((100vw - 320px) / ${Math.min(numberOfDays, 5)})`
                  }}
                >
                  <DayColumn
                    date={day}
                    tasks={allTasks}
                    isToday={index === 0 && isToday(day)}
                    onAddTask={handleAddTask}
                  />
                </div>
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="rotate-2 shadow-2xl border border-blue-200 bg-white rounded-lg">
                <TaskCard task={activeTask} isDragging={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && selectedTaskForScheduling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Schedule: {selectedTaskForScheduling.title}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date:
              </label>
              <input
                type="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  setSelectedTaskForScheduling(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlannerView;