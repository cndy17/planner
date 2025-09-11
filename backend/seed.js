const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.area.deleteMany();
  await prisma.tag.deleteMany();

  // Create tags
  const importantTag = await prisma.tag.create({
    data: { name: 'Important', color: '#ef4444' }
  });
  
  const urgentTag = await prisma.tag.create({
    data: { name: 'Urgent', color: '#f59e0b' }
  });

  const personalTag = await prisma.tag.create({
    data: { name: 'Personal', color: '#3b82f6' }
  });

  // Create Areas
  const familyArea = await prisma.area.create({
    data: {
      name: 'Family',
      color: '#10b981',
      projects: {
        create: [
          {
            name: 'Vacation in Rome',
            description: 'Plan the family trip to Rome'
          },
          {
            name: 'Buy a New Car',
            description: 'Research and purchase a family vehicle'
          },
          {
            name: 'Throw Party for Eve',
            description: "Organize Eve's birthday celebration"
          }
        ]
      }
    },
    include: { projects: true }
  });

  const workArea = await prisma.area.create({
    data: {
      name: 'Work',
      color: '#6366f1',
      projects: {
        create: [
          {
            name: 'Prepare Presentation',
            description: 'Keep the talk and slides simple: what are the three things about this that everyone should remember?'
          },
          {
            name: 'Onboard James',
            description: 'Help new team member get up to speed'
          },
          {
            name: 'Attend Conference',
            description: 'Annual tech conference attendance and networking'
          },
          {
            name: 'Order Team T-Shirts',
            description: 'Design and order team swag'
          }
        ]
      }
    },
    include: { projects: true }
  });

  const hobbiesArea = await prisma.area.create({
    data: {
      name: 'Hobbies',
      color: '#ec4899',
      projects: {
        create: [
          {
            name: 'Learn Basic Italian',
            description: 'Prepare for the Rome trip'
          },
          {
            name: 'Run a Marathon',
            description: 'Train for the city marathon'
          }
        ]
      }
    },
    include: { projects: true }
  });

  // Get project IDs
  const presentationProject = workArea.projects.find(p => p.name === 'Prepare Presentation');
  const romeProject = familyArea.projects.find(p => p.name === 'Vacation in Rome');
  const marathonProject = hobbiesArea.projects.find(p => p.name === 'Run a Marathon');

  // Create tasks for Presentation Project
  await prisma.task.create({
    data: {
      title: 'Revise introduction',
      status: 'pending',
      projectId: presentationProject.id,
      parentTaskId: null
    }
  });

  await prisma.task.create({
    data: {
      title: 'Simplify slide layouts',
      status: 'pending',
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Review quarterly data with Olivia',
      status: 'pending',
      flagged: true,
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Print handouts for attendees',
      status: 'pending',
      dueDate: new Date('2024-11-13'),
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Email John for presentation tips',
      status: 'pending',
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Check out book recommendations',
      status: 'pending',
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Time a full rehearsal',
      status: 'pending',
      priority: 'high',
      projectId: presentationProject.id,
      tags: {
        connect: [{ id: importantTag.id }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Do a practice run with Eric',
      status: 'pending',
      projectId: presentationProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Confirm presentation time',
      status: 'pending',
      priority: 'high',
      projectId: presentationProject.id,
      tags: {
        connect: [{ id: importantTag.id }]
      }
    }
  });

  // Create some inbox tasks (no project)
  await prisma.task.create({
    data: {
      title: 'Buy groceries',
      status: 'pending',
      dueDate: new Date(),
      tags: {
        connect: [{ id: personalTag.id }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Call dentist for appointment',
      status: 'pending',
      priority: 'medium',
      tags: {
        connect: [{ id: personalTag.id }]
      }
    }
  });

  // Create tasks for Rome vacation
  await prisma.task.create({
    data: {
      title: 'Book flights',
      status: 'completed',
      projectId: romeProject.id,
      priority: 'high'
    }
  });

  await prisma.task.create({
    data: {
      title: 'Reserve hotel',
      status: 'completed',
      projectId: romeProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Plan itinerary',
      status: 'pending',
      projectId: romeProject.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    }
  });

  await prisma.task.create({
    data: {
      title: 'Get travel insurance',
      status: 'pending',
      projectId: romeProject.id,
      priority: 'high',
      tags: {
        connect: [{ id: urgentTag.id }]
      }
    }
  });

  // Create tasks for Marathon
  await prisma.task.create({
    data: {
      title: 'Week 1 training - 5k runs',
      status: 'completed',
      projectId: marathonProject.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Week 2 training - 10k runs',
      status: 'pending',
      projectId: marathonProject.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.task.create({
    data: {
      title: 'Buy new running shoes',
      status: 'pending',
      projectId: marathonProject.id,
      priority: 'medium'
    }
  });

  await prisma.task.create({
    data: {
      title: 'Register for marathon',
      status: 'pending',
      projectId: marathonProject.id,
      priority: 'high',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: {
        connect: [{ id: importantTag.id }]
      }
    }
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });