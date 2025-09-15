import React, { useState } from 'react';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface SimpleDragListProps {
  tasks: Task[];
  showProject?: boolean;
  onReorder?: (tasks: Task[]) => void;
}

const SimpleDragList: React.FC<SimpleDragListProps> = ({ 
  tasks, 
  showProject = true, 
  onReorder 
}) => {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Update local tasks when props change
  React.useEffect(() => {
    console.log('SimpleDragList: tasks prop changed', tasks.map(t => t.title));
    setLocalTasks(tasks);
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    console.log('SimpleDragList: Drag start', index, localTasks[index].title);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedIndexFromData = parseInt(e.dataTransfer.getData('text/plain'));
    console.log('SimpleDragList: Drop event', { draggedIndex, draggedIndexFromData, dropIndex });
    
    const sourceIndex = draggedIndex !== null ? draggedIndex : draggedIndexFromData;
    
    if (sourceIndex === dropIndex || sourceIndex === -1 || isNaN(sourceIndex)) {
      console.log('SimpleDragList: No reorder needed', { sourceIndex, dropIndex });
      setDraggedIndex(null);
      return;
    }

    console.log('SimpleDragList: Dropping', sourceIndex, 'onto', dropIndex);
    
    const newTasks = [...localTasks];
    const draggedTask = newTasks[sourceIndex];
    
    // Remove dragged item
    newTasks.splice(sourceIndex, 1);
    // Insert at new position (adjust if we removed from earlier position)
    const adjustedDropIndex = sourceIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newTasks.splice(adjustedDropIndex, 0, draggedTask);
    
    console.log('SimpleDragList: New order:', newTasks.map(t => t.title));
    
    setLocalTasks(newTasks);
    setDraggedIndex(null);
    
    if (onReorder) {
      console.log('SimpleDragList: Calling onReorder');
      onReorder(newTasks);
    }
  };

  const handleDragEnd = () => {
    console.log('SimpleDragList: Drag end');
    setDraggedIndex(null);
  };

  if (localTasks.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No tasks to display
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {localTasks.map((task, index) => (
        <div
          key={task.id}
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            ${onReorder ? 'cursor-move' : ''}
            ${draggedIndex === index ? 'opacity-50' : ''}
            transition-opacity duration-200
          `}
          style={{
            opacity: draggedIndex === index ? 0.5 : 1
          }}
        >
          <TaskCard 
            task={task} 
            showProject={showProject}
            isDragging={draggedIndex === index}
          />
        </div>
      ))}
    </div>
  );
};

export default SimpleDragList;