import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      <TaskCard 
        task={task} 
        showProject={showProject} 
        isDragging={isDragging}
      />
    </div>
  );
};

interface TaskListSimpleProps {
  tasks: Task[];
  showProject?: boolean;
  onReorder?: (tasks: Task[]) => void;
}

const TaskListSimple: React.FC<TaskListSimpleProps> = ({ 
  tasks, 
  showProject = true, 
  onReorder 
}) => {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Update local tasks when props change (but not during drag)
  useEffect(() => {
    if (!activeTask) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('handleDragStart:', event.active.id);
    const task = localTasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
    console.log('activeTask set to:', task?.title);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('handleDragEnd:', { activeId: active.id, overId: over?.id });
    setActiveTask(null);

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = localTasks.findIndex((t) => t.id === active.id);
      const newIndex = localTasks.findIndex((t) => t.id === over.id);
      
      console.log('Drag indexes:', { oldIndex, newIndex });

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(localTasks, oldIndex, newIndex);
        console.log('Calling onReorder with new tasks:', newTasks.map(t => t.title));
        setLocalTasks(newTasks);
        onReorder(newTasks);
      } else {
        console.log('Invalid indexes, not reordering');
      }
    } else {
      console.log('Not reordering because:', {
        hasOver: !!over,
        sameId: active.id === over?.id,
        hasOnReorder: !!onReorder
      });
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No tasks to display
      </div>
    );
  }

  // If no reorder handler, just render tasks without drag and drop
  if (!onReorder) {
    return (
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id}
            task={task} 
            showProject={showProject} 
          />
        ))}
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
      
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90">
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

export default TaskListSimple;