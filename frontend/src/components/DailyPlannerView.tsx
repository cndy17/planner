import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task, TaskType, TaskFilter } from '../types';
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
  PanelLeftOpen,
  Square,
  TrendingUp,
  CheckCircle2,
  List,
  Filter,
  FolderOpen,
  Layers,
  ChevronDown
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
  onSearchChange: React.Dispatch<React.SetStateAction<string>>;
  onScheduleTask: (task: Task) => void;
  hideCompletedTasks: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedFilter: TaskFilter;
  onFilterChange: React.Dispatch<React.SetStateAction<TaskFilter>>;
  selectedAreaId?: string | null;
  onAreaFilterChange: (areaId: string | null) => void;
  selectedProjectId?: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
}

const UnscheduledTasksColumn: React.FC<UnscheduledTasksColumnProps> = ({
  tasks,
  searchQuery,
  onSearchChange,
  onScheduleTask,
  hideCompletedTasks,
  isCollapsed,
  onToggleCollapse,
  selectedFilter,
  onFilterChange,
  selectedAreaId,
  onAreaFilterChange,
  selectedProjectId,
  onProjectFilterChange
}) => {
  const { projects, areas } = useApp();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Apply all filters
  const filteredTasks = tasks.filter(task => {
    if (hideCompletedTasks && task.status === 'completed') return false;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return task.title.toLowerCase().includes(query) ||
             (task.notes && task.notes.toLowerCase().includes(query));
    }

    // Task type filter
    if (selectedFilter !== 'all') {
      const typeMap: Record<TaskFilter, TaskType> = {
        'all': 'task',
        'tasks': 'task',
        'updates': 'update',
        'actions': 'action',
        'next-steps': 'next-step'
      };

      if (task.taskType !== typeMap[selectedFilter]) {
        return false;
      }
    }

    // Area filter
    if (selectedAreaId) {
      if (!task.projectId) return false;
      const taskProject = projects.find(p => p.id === task.projectId);
      if (!taskProject || taskProject.areaId !== selectedAreaId) return false;
    }

    // Project filter
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;

    return true;
  });

  const getFilterIcon = (filter: TaskFilter) => {
    switch (filter) {
      case 'tasks': return Square;
      case 'updates': return TrendingUp;
      case 'actions': return CheckCircle2;
      case 'next-steps': return ArrowRight;
      default: return List;
    }
  };

  const getFilterColor = (filter: TaskFilter) => {
    switch (filter) {
      case 'tasks': return 'text-blue-600 bg-blue-50';
      case 'updates': return 'text-green-600 bg-green-50';
      case 'actions': return 'text-orange-600 bg-orange-50';
      case 'next-steps': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFilterLabel = (filter: TaskFilter) => {
    switch (filter) {
      case 'tasks': return 'Tasks';
      case 'updates': return 'Updates';
      case 'actions': return 'Actions';
      case 'next-steps': return 'Next Steps';
      default: return 'All';
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="bg-gray-100 p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <h3 className="font-semibold text-gray-800">
              Unscheduled ({filteredTasks.length})
            </h3>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="relative">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between p-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Filter</span>
              {(selectedFilter !== 'all' || selectedAreaId || selectedProjectId) && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                  Active
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isFilterExpanded && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterExpanded(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 space-y-3">
                {/* Task Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Task Type</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['all', 'tasks', 'updates', 'actions', 'next-steps'] as TaskFilter[]).map((filter) => {
                      const Icon = getFilterIcon(filter);
                      return (
                        <button
                          key={filter}
                          onClick={() => onFilterChange(filter)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
                            selectedFilter === filter
                              ? getFilterColor(filter)
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getFilterLabel(filter)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Area Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Area</label>
                  <select
                    value={selectedAreaId || ''}
                    onChange={(e) => onAreaFilterChange(e.target.value || null)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Areas</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => onProjectFilterChange(e.target.value || null)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => {
                      const projectArea = areas.find(a => a.id === project.areaId);
                      return (
                        <option key={project.id} value={project.id}>
                          {projectArea ? `${projectArea.name}: ${project.name}` : project.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedFilter !== 'all' || selectedAreaId || selectedProjectId) && (
                  <button
                    onClick={() => {
                      onFilterChange('all');
                      onAreaFilterChange(null);
                      onProjectFilterChange(null);
                    }}
                    className="w-full px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm text-center">
              {searchQuery ? 'No tasks match your search' : 'No unscheduled tasks'}
            </p>
          </div>
        ) : (
          <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  showScheduleButton={true}
                  onScheduleClick={onScheduleTask}
                />
              ))}
            </div>
          </SortableContext>
        )}
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
      return isSameDay(new Date(task.dueDate), date);
    }
    return false;
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {/* Header */}
      <div className={`p-3 border-b border-gray-200 flex-shrink-0 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
            {isToday ? 'Today' : format(date, 'EEE, MMM d')}
          </h3>
          <span className="text-sm text-gray-500">
            {displayTasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(date)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add task</span>
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {displayTasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

interface DayColumnContentProps {
  date: Date;
  tasks: Task[];
  isToday?: boolean;
}

const DayColumnContent: React.FC<DayColumnContentProps> = ({
  date,
  tasks,
  isToday = false
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
  });

  const displayTasks = tasks.filter(task => {
    if (task.plannedDate) {
      const plannedDate = new Date(task.plannedDate);
      if (isNaN(plannedDate.getTime())) {
        console.warn('DayColumnContent: Invalid plannedDate for task:', task.id, task.plannedDate);
        return false;
      }
      const matches = isSameDay(plannedDate, date);
      if (matches) {
        console.log('DayColumnContent: Task', task.title, 'matches date', format(date, 'yyyy-MM-dd'), 'planned:', format(plannedDate, 'yyyy-MM-dd'));
      }
      return matches;
    }
    // For today's column, also show tasks due today
    if (isToday && task.dueDate) {
      return isSameDay(new Date(task.dueDate), date);
    }
    return false;
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 flex-shrink-0 bg-white border-r border-gray-200 ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {/* Tasks Content */}
      <div className="h-full overflow-y-auto custom-scrollbar p-3">
        <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {displayTasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({ hideCompletedTasks = false }) => {
  const { tasks, addTask, updateTask, projects, areas } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isUnscheduledCollapsed, setIsUnscheduledCollapsed] = useState(false);
  const [unscheduledFilter, setUnscheduledFilter] = useState<TaskFilter>('all');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Generate dates: 1 day before today + today + 4 days after
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(today);
    date.setDate(today.getDate() + (i - 1)); // -1 to start 1 day before today
    return date;
  });

  // Filter tasks
  const unscheduledTasks = tasks.filter(task =>
    !task.plannedDate &&
    (!hideCompletedTasks || task.status !== 'completed')
  );

  const overdueTasks = tasks.filter(task =>
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate)) &&
    task.status !== 'completed'
  );

  const scheduledTasks = tasks.filter(task =>
    task.plannedDate &&
    (!hideCompletedTasks || task.status !== 'completed')
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const droppableId = over.id as string;

    // Check if dropping on a date
    const dateMatch = droppableId.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateMatch) {
      const targetDate = new Date(droppableId);
      updateTask(taskId, { plannedDate: targetDate });
    }
  };

  const handleScheduleTask = (task: Task) => {
    // Schedule for today by default
    const today = new Date();
    updateTask(task.id, { plannedDate: today });
  };

  const handleAddTask = async (plannedDate: Date) => {
    // Determine task type based on current filter
    const getTaskTypeFromFilter = (filter: TaskFilter): TaskType => {
      const typeMap: Record<string, TaskType> = {
        'updates': 'update',
        'actions': 'action',
        'next-steps': 'next-step',
        'tasks': 'task'
      };
      return typeMap[filter] || 'task';
    };

    await addTask({
      title: 'New task',
      status: 'pending',
      taskType: getTaskTypeFromFilter(unscheduledFilter),
      plannedDate: plannedDate,
      flagged: false,
      tags: [],
      order: 0
    });
  };


  return (
    <div className="h-full pb-14">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full">
          {/* Unscheduled Tasks Column */}
          <UnscheduledTasksColumn
            tasks={[...unscheduledTasks, ...overdueTasks]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onScheduleTask={handleScheduleTask}
            hideCompletedTasks={hideCompletedTasks}
            isCollapsed={isUnscheduledCollapsed}
            onToggleCollapse={() => setIsUnscheduledCollapsed(!isUnscheduledCollapsed)}
            selectedFilter={unscheduledFilter}
            onFilterChange={setUnscheduledFilter}
            selectedAreaId={selectedAreaId}
            onAreaFilterChange={setSelectedAreaId}
            selectedProjectId={selectedProjectId}
            onProjectFilterChange={setSelectedProjectId}
          />

          {/* Calendar Section */}
          <div className="flex-1 flex flex-col">
            {/* Main Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-center flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(weekDates[0], 'MMM d')} - {format(weekDates[5], 'MMM d, yyyy')}
              </h2>
            </div>

            {/* Day Headers - Fixed */}
            <div className="flex bg-gray-50 border-b border-gray-200 flex-shrink-0">
              {weekDates.map((date, index) => (
                <div
                  key={`header-${format(date, 'yyyy-MM-dd')}`}
                  className={`w-64 flex-shrink-0 p-3 border-r border-gray-200 ${isToday(date) ? 'bg-blue-50' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${isToday(date) ? 'text-blue-800' : 'text-gray-800'}`}>
                      {isToday(date) ? 'Today' : format(date, 'EEE, MMM d')}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {scheduledTasks.filter(task => {
                        if (task.plannedDate) {
                          const plannedDate = new Date(task.plannedDate);
                          if (isNaN(plannedDate.getTime())) return false;
                          const matches = isSameDay(plannedDate, date);
                          return matches;
                        }
                        if (isToday(date) && task.dueDate) {
                          return isSameDay(new Date(task.dueDate), date);
                        }
                        return false;
                      }).length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTask(date)}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add task</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Day Columns Content - Scrollable */}
            <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
              {weekDates.map((date, index) => (
                <DayColumnContent
                  key={format(date, 'yyyy-MM-dd')}
                  date={date}
                  tasks={scheduledTasks}
                  isToday={isToday(date)}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggedTask && (
            <div className="rotate-2 shadow-xl">
              <TaskCard task={draggedTask} isDragging={true} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default DailyPlannerView;