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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ 
  id, 
  children, 
  isDragOverlay = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isDragOverlay,
  });

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
      className={`${isDragging ? 'z-50' : ''}`}
    >
      {children}
    </div>
  );
};

interface DraggableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T) => string;
}

export function DraggableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
}: DraggableListProps<T>) {
  const [localItems, setLocalItems] = useState(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync with external items when they change (but not during drag)
  useEffect(() => {
    if (!activeId) {
      setLocalItems(items);
    }
  }, [items, activeId]);

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
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => keyExtractor(item) === active.id);
      const newIndex = localItems.findIndex((item) => keyExtractor(item) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(localItems, oldIndex, newIndex);
        setLocalItems(newItems);
        onReorder(newItems);
      }
    }
    
    setActiveId(null);
  };

  const activeItem = activeId 
    ? localItems.find(item => keyExtractor(item) === activeId) 
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {localItems.map((item, index) => (
            <DraggableItem key={keyExtractor(item)} id={keyExtractor(item)}>
              {renderItem(item, index)}
            </DraggableItem>
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            {renderItem(activeItem, 0)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}