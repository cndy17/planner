import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task } from '../types';
import TaskCard from './TaskCard';
import DraggableTaskItem from './DraggableTaskItem';

interface DraggableTaskListProps {
  tasks: Task[];
  showProject?: boolean;
  onReorder?: (reorderedTasks: Task[]) => void;
}

const DraggableTaskList: React.FC<DraggableTaskListProps> = ({ 
  tasks, 
  showProject = true, 
  onReorder 
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Update local tasks when props change (only when not dragging)
  useEffect(() => {
    console.log('DraggableTaskList: tasks prop changed', tasks.map(t => t.title));
    
    // Always sync with props when not dragging
    if (!activeTask) {
      setLocalTasks(tasks);
      console.log('DraggableTaskList: Updated local tasks from props');
    }
  }, [tasks, activeTask]);

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
    console.log('DraggableTaskList: Drag started', event.active.id);
    const task = localTasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('DRAG END: Starting handleDragEnd', { 
      activeId: active.id, 
      overId: over?.id,
      hasOnReorder: !!onReorder
    });

    setActiveTask(null);

    if (!over || active.id === over.id) {
      console.log('DRAG END: No reorder needed - same position');
      return;
    }

    const oldIndex = localTasks.findIndex(task => task.id === active.id);
    const newIndex = localTasks.findIndex(task => task.id === over.id);

    console.log('DRAG END: Found indices', { oldIndex, newIndex, totalTasks: localTasks.length });

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedTasks = arrayMove(localTasks, oldIndex, newIndex);
      
      console.log('DRAG END: Reordered tasks:', reorderedTasks.map((t, i) => `${i}: ${t.title}`));
      
      // Update local state immediately for smooth UI
      setLocalTasks(reorderedTasks);
      
      // Call the reorder callback if provided
      if (onReorder) {
        console.log('DRAG END: About to call onReorder with', reorderedTasks.length, 'tasks');
        onReorder(reorderedTasks);
        console.log('DRAG END: onReorder call completed');
      } else {
        console.log('DRAG END: No onReorder callback provided');
      }
    } else {
      console.log('DRAG END: Invalid indices - canceling reorder');
    }
  };

  if (localTasks.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No tasks to display
      </div>
    );
  }

  // If no onReorder callback, render without drag-and-drop
  if (!onReorder) {
    return (
      <div className="space-y-1">
        {localTasks.map((task) => (
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
        items={localTasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {localTasks.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              showProject={showProject}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 shadow-2xl border border-blue-200 bg-white rounded-lg">
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

export default DraggableTaskList;