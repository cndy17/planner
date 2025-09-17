const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAreaOrder() {
  try {
    console.log('Starting area order fix...');
    
    // Get all areas without proper order values
    const areas = await prisma.area.findMany({
      orderBy: { name: 'asc' } // Order by name temporarily
    });
    
    console.log(`Found ${areas.length} areas to update`);
    
    // Update each area with sequential order values
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      console.log(`Updating area "${area.name}" with order ${i}`);
      
      await prisma.area.update({
        where: { id: area.id },
        data: { order: i }
      });
    }
    
    console.log('Area order fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing area order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAreaOrder();