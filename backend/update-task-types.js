const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTaskTypes() {
  try {
    console.log('Starting task type migration...');

    // First, let's check what the current state is
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        taskType: true
      }
    });

    console.log(`Found ${allTasks.length} tasks total`);

    // Count current task types
    const typeCount = {};
    allTasks.forEach(task => {
      typeCount[task.taskType || 'undefined'] = (typeCount[task.taskType || 'undefined'] || 0) + 1;
    });

    console.log('Current task type distribution:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} tasks`);
    });

    // Update all tasks to have taskType 'task' (since the field is required with default, this should work)
    const result = await prisma.task.updateMany({
      where: {},
      data: {
        taskType: 'task'
      }
    });

    console.log(`Updated ${result.count} tasks to have taskType 'task'`);

    // Verify the update worked
    const updatedTasks = await prisma.task.findMany({
      select: {
        taskType: true
      }
    });

    const updatedTypeCount = {};
    updatedTasks.forEach(task => {
      updatedTypeCount[task.taskType] = (updatedTypeCount[task.taskType] || 0) + 1;
    });

    console.log('Task type counts after migration:');
    Object.entries(updatedTypeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} tasks`);
    });

  } catch (error) {
    console.error('Error during task type migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaskTypes();