const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProjectOrder() {
  console.log('Starting to fix project order values...');
  
  try {
    // Get all projects ordered by creation time (id)
    const projects = await prisma.project.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${projects.length} projects to update with proper order values`);

    // Update each project with sequential order values within their area
    const areaGroups = {};
    
    // Group projects by area
    for (const project of projects) {
      const areaKey = project.areaId || 'no-area';
      if (!areaGroups[areaKey]) {
        areaGroups[areaKey] = [];
      }
      areaGroups[areaKey].push(project);
    }

    // Update order values within each area
    for (const [areaKey, areaProjects] of Object.entries(areaGroups)) {
      console.log(`Updating ${areaProjects.length} projects in area: ${areaKey}`);
      
      for (let i = 0; i < areaProjects.length; i++) {
        await prisma.project.update({
          where: { id: areaProjects[i].id },
          data: { order: i }
        });
        console.log(`  Updated project "${areaProjects[i].name}" with order ${i}`);
      }
    }

    console.log('Successfully fixed project order values!');
    
  } catch (error) {
    console.error('Error fixing project order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectOrder();