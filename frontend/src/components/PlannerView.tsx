import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task } from '../types';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import {
  DndContext,
  closestCenter,
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

interface PlannerViewProps {
  view: 'today' | 'upcoming';
  hideCompletedTasks?: boolean;
}

interface SortableTaskCardProps {
  task: Task;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task }) => {
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
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: 'pending' | 'in_progress' | 'completed';
  bgColor: string;
  textColor: string;
  hideCompleted?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  tasks,
  status,
  bgColor,
  textColor,
  hideCompleted = false
}) => {
  const { setIsQuickEntryOpen } = useApp();
  const { isOver, setNodeRef } = useDroppable({
    id: `${status}-column`,
  });

  const filteredTasks = hideCompleted && status === 'completed' ? [] : tasks;
  const displayTasks = filteredTasks.filter(task => {
    if (status === 'in_progress') {
      // For in_progress column, show tasks with custom status or high priority pending tasks
      return task.status === 'pending' && (task.priority === 'high' || task.flagged);
    }
    return task.status === status;
  });

  return (
    <div className="flex-1 min-w-0">
      <div className={`${bgColor} ${textColor} p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
            {displayTasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`bg-gray-50 border-l border-r border-gray-200 min-h-[500px] p-3 transition-colors ${
          isOver ? 'bg-gray-100' : ''
        }`}
      >
        <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {displayTasks.map(task => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {displayTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-2">No tasks</p>
                {status === 'pending' && (
                  <button
                    onClick={() => setIsQuickEntryOpen(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Add a task
                  </button>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      <div className="bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-lg p-2">
        {status === 'pending' && (
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
};

const PlannerView: React.FC<PlannerViewProps> = ({ view, hideCompletedTasks = false }) => {
  const { tasks, updateTask } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const getTasksForCurrentView = (): Task[] => {
    if (viewMode === 'day') {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      return tasks.filter(task => {
        // Include tasks due today, or tasks without due date for planning
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return isWithinInterval(dueDate, { start: dayStart, end: dayEnd });
        }
        // Include tasks without due dates for planning
        return task.status === 'pending' || task.status === 'completed';
      });
    } else {
      // Week view
      const weekStart = startOfDay(currentDate);
      const weekEnd = endOfDay(addDays(currentDate, 6));
      return tasks.filter(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
        }
        return task.status === 'pending' || task.status === 'completed';
      });
    }
  };

  const rolloverIncompleTasks = async () => {
    const yesterday = startOfDay(subDays(currentDate, 1));
    const yesterdayEnd = endOfDay(subDays(currentDate, 1));

    const incompleteTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return isWithinInterval(dueDate, { start: yesterday, end: yesterdayEnd }) &&
             task.status === 'pending';
    });

    for (const task of incompleteTasks) {
      await updateTask(task.id, { dueDate: currentDate });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus: 'pending' | 'completed' = task.status as 'pending' | 'completed';
    let updateData: any = {};

    // Determine new status based on drop zone
    if (over.id === 'pending-column') {
      newStatus = 'pending';
      updateData.priority = null; // Remove high priority when moving to pending
      updateData.flagged = false; // Remove flag when moving to pending
    } else if (over.id === 'in_progress-column') {
      newStatus = 'pending';
      updateData.priority = 'high'; // Set high priority for in-progress
    } else if (over.id === 'completed-column') {
      newStatus = 'completed';
    }

    // Update the task if status or other properties changed
    if (newStatus !== task.status || Object.keys(updateData).length > 0) {
      await updateTask(taskId, { status: newStatus, ...updateData });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : subDays(currentDate, 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const currentTasks = getTasksForCurrentView();
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Planner</h1>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'day'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {viewMode === 'day'
                      ? format(currentDate, 'EEEE, MMMM d, yyyy')
                      : `${format(currentDate, 'MMM d')} - ${format(addDays(currentDate, 6), 'MMM d, yyyy')}`
                    }
                  </h2>
                </div>

                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={goToToday}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            {/* Rollover Button */}
            <button
              onClick={rolloverIncompleTasks}
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Roll over incomplete tasks from yesterday"
            >
              <RotateCcw className="w-4 h-4" />
              Roll over tasks
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              <KanbanColumn
                title="To Do"
                tasks={currentTasks}
                status="pending"
                bgColor="bg-blue-500"
                textColor="text-white"
                hideCompleted={hideCompletedTasks}
              />

              <KanbanColumn
                title="In Progress"
                tasks={currentTasks}
                status="in_progress"
                bgColor="bg-yellow-500"
                textColor="text-white"
                hideCompleted={hideCompletedTasks}
              />

              <KanbanColumn
                title="Done"
                tasks={currentTasks}
                status="completed"
                bgColor="bg-green-500"
                textColor="text-white"
                hideCompleted={hideCompletedTasks}
              />
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="rotate-2 shadow-2xl border border-primary-200 bg-white rounded-lg">
                <TaskCard task={activeTask} isDragging={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default PlannerView;