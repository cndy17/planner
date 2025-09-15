/**
 * Calculate a new order value for inserting an item between two others
 * Uses fractional ordering to allow infinite insertions without reordering all items
 */
export const getNewOrder = (
  prevOrder: number | null,
  nextOrder: number | null
): number => {
  // If no previous item (inserting at the beginning)
  if (prevOrder === null || prevOrder === undefined) {
    if (nextOrder === null || nextOrder === undefined) return 1000; // First item ever
    return nextOrder / 2; // Insert before first item
  }
  
  // If no next item (inserting at the end)
  if (nextOrder === null || nextOrder === undefined) {
    return prevOrder + 1000; // Insert after last item
  }
  
  // Insert between two items
  return prevOrder + (nextOrder - prevOrder) / 2;
};

/**
 * Get the new order value for a moved item based on its destination index
 */
export const getOrderForIndex = (
  items: Array<{ order: number }>,
  destinationIndex: number
): number => {
  if (items.length === 0) return 1000;
  
  // Moving to the beginning
  if (destinationIndex === 0) {
    return items[0].order / 2;
  }
  
  // Moving to the end
  if (destinationIndex >= items.length) {
    return items[items.length - 1].order + 1000;
  }
  
  // Moving between two items
  const prevItem = items[destinationIndex - 1];
  const nextItem = items[destinationIndex];
  return getNewOrder(prevItem.order, nextItem.order);
};

/**
 * Calculate order for a moved item in a reordered array
 */
export const calculateNewOrder = (
  reorderedItems: Array<{ id: string; order: number }>,
  movedItemId: string
): number => {
  const movedIndex = reorderedItems.findIndex(item => item.id === movedItemId);
  
  if (movedIndex === -1) return 1000;
  
  const prevItem = movedIndex > 0 ? reorderedItems[movedIndex - 1] : null;
  const nextItem = movedIndex < reorderedItems.length - 1 ? reorderedItems[movedIndex + 1] : null;
  
  return getNewOrder(prevItem?.order || null, nextItem?.order || null);
};