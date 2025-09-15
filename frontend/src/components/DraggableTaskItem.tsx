import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface DraggableTaskItemProps {
  task: Task;
  showProject?: boolean;
}

const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({ 
  task, 
  showProject = true 
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
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard 
        task={task} 
        showProject={showProject}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggableTaskItem;