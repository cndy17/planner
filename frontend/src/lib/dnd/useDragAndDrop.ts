import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDragAndDropOptions<T> {
  onReorder: (items: T[], movedItem: T, fromIndex: number, toIndex: number) => void;
  getItemId: (item: T) => string;
}

export function useDragAndDrop<T>({
  onReorder,
  getItemId,
}: UseDragAndDropOptions<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  const handleReorder = useCallback((items: T[]) => {
    setIsDragging(true);
    
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Find which item was moved (this is a simplified detection)
    // In a real scenario, you'd track the dragged item explicitly
    const movedItem = items[0]; // Placeholder - should track actual moved item
    const fromIndex = 0; // Placeholder
    const toIndex = 0; // Placeholder
    
    onReorder(items, movedItem, fromIndex, toIndex);
    
    // Reset dragging state after a delay
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 500);
  }, [onReorder]);

  return {
    isDragging,
    handleReorder,
  };
}