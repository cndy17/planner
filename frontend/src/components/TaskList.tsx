import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
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
  sortableKeyboardCoordinates,
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

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <TaskCard 
        task={task} 
        showProject={showProject} 
        dragHandleProps={dragHandleProps}
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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      
      // Update order in parent component
      if (onReorder) {
        onReorder(newTasks);
      }

      // Update order in database
      // You might want to add an 'order' field to tasks
      // For now, we'll just trigger a re-render
    }

    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (tasks.length === 0) {
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
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {tasks.map((task) => (
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