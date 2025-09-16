import React from 'react';
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import TaskCard from './TaskCard';
import { useApp } from '../context/AppContext';

interface SortableTaskProps {
  task: Task;
  showProject?: boolean;
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, showProject }) => {
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
      <TaskCard 
        task={task} 
        showProject={showProject} 
        isDragging={isDragging}
      />
    </div>
  );
};

interface TaskListProps {
  tasks: Task[];
  showProject?: boolean;
  onReorder?: (tasks: Task[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, showProject = true, onReorder }) => {
  const { updateTask } = useApp();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localTasks, setLocalTasks] = React.useState(tasks);
  
  // Update local tasks only when not dragging
  React.useEffect(() => {
    if (!activeId) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeId]);
  
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
    // Removed KeyboardSensor to prevent space bar conflicts with input fields
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag started:', active.id);
    setActiveId(active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((t) => t.id === active.id);
      const newIndex = localTasks.findIndex((t) => t.id === over.id);

      console.log('Reordering:', { oldIndex, newIndex });
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      
      // Update local state immediately for responsive UI
      setLocalTasks(newTasks);
      
      // Update order in parent component
      if (onReorder) {
        console.log('Calling onReorder with new tasks');
        onReorder(newTasks);
      }
    }

    setActiveId(null);
  };

  const activeTask = activeId ? localTasks.find(t => t.id === activeId) : null;

  if (localTasks.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No tasks to display
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localTasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {localTasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              showProject={showProject}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-2 shadow-2xl border border-primary-200 bg-white rounded-lg">
            <TaskCard 
              task={activeTask} 
              showProject={showProject} 
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskList;