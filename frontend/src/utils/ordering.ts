/**
 * Calculate a new order value for inserting an item between two others
 * Uses fractional ordering to allow infinite insertions without reordering all items
 */
export const getNewOrder = (
  prevOrder: number | null,
  nextOrder: number | null
): number => {
  // If no previous item (inserting at the beginning)
  if (prevOrder === null) {
    if (nextOrder === null) return 1; // First item ever
    return nextOrder / 2; // Insert before first item
  }
  
  // If no next item (inserting at the end)
  if (nextOrder === null) {
    return prevOrder + 1; // Insert after last item
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
  if (items.length === 0) return 1;
  
  // Moving to the beginning
  if (destinationIndex === 0) {
    return items[0].order / 2;
  }
  
  // Moving to the end
  if (destinationIndex >= items.length) {
    return items[items.length - 1].order + 1;
  }
  
  // Moving between two items
  const prevItem = items[destinationIndex - 1];
  const nextItem = items[destinationIndex];
  return getNewOrder(prevItem.order, nextItem.order);
};