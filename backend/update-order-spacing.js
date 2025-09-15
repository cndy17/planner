const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOrderSpacing() {
  try {
    // Get all tasks ordered by current order
    const tasks = await prisma.task.findMany({
      orderBy: { order: 'asc' }
    });

    console.log(`Updating order values for ${tasks.length} tasks...`);

    // Update each task with new order value (spaced by 1000)
    for (let i = 0; i < tasks.length; i++) {
      await prisma.task.update({
        where: { id: tasks[i].id },
        data: { order: (i + 1) * 1000 }
      });
    }

    console.log('Order values updated successfully!');
  } catch (error) {
    console.error('Error updating order values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrderSpacing();