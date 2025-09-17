require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

// Area routes
app.get('/areas', async (req, res) => {
  try {
    const areas = await prisma.area.findMany({ 
      include: { 
        projects: {
          include: {
            tasks: true
          }
        } 
      },
      orderBy: { order: 'asc' }
    });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/areas', async (req, res) => {
  try {
    const area = await prisma.area.create({
      data: req.body,
      include: { projects: true }
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Area reordering endpoint - MUST come before PUT /areas/:id
app.put('/areas/reorder', async (req, res) => {
  try {
    const { areaIds } = req.body;
    
    // Update order for each area
    const updatePromises = areaIds.map((areaId, index) =>
      prisma.area.update({
        where: { id: areaId },
        data: { order: index }
      })
    );
    
    await Promise.all(updatePromises);
    res.json({ success: true });
  } catch (error) {
    console.error('Area reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/areas/:id', async (req, res) => {
  try {
    const area = await prisma.area.update({
      where: { id: req.params.id },
      data: req.body,
      include: { projects: true }
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/areas/:id', async (req, res) => {
  try {
    await prisma.area.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project routes
app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ 
      include: { 
        tasks: {
          include: {
            tags: true,
            subtasks: true
          }
        }, 
        area: true 
      },
      orderBy: [
        { areaId: 'asc' },
        { order: 'asc' }
      ]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project reordering endpoint - MUST come before PUT /projects/:id
app.put('/projects/reorder', async (req, res) => {
  try {
    const { projectIds } = req.body;
    
    // Update order for each project
    const updatePromises = projectIds.map((projectId, index) =>
      prisma.project.update({
        where: { id: projectId },
        data: { order: index }
      })
    );
    
    await Promise.all(updatePromises);
    
    // Return updated projects
    const updatedProjects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: { tasks: true, area: true },
      orderBy: { order: 'asc' }
    });
    
    res.json(updatedProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: req.body,
      include: { tasks: true, area: true }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: { tasks: true, area: true }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task routes
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ 
      include: { 
        tags: true, 
        project: true,
        subtasks: {
          include: {
            tags: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const { tags, ...taskData } = req.body;
    const task = await prisma.task.create({
      data: {
        ...taskData,
        tags: tags ? {
          connect: tags.map(tag => ({ id: tag.id }))
        } : undefined
      },
      include: { tags: true, project: true, subtasks: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    console.log(`PUT /tasks/${req.params.id}`, req.body);
    const { tags, ...taskData } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...taskData,
        tags: tags ? {
          set: tags.map(tag => ({ id: tag.id }))
        } : undefined
      },
      include: { tags: true, project: true, subtasks: true }
    });
    console.log(`Task updated:`, task.title, 'order:', task.order);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task reordering endpoint
app.put('/tasks/reorder', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    // Update order for each task
    const updatePromises = taskIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { order: index }
      })
    );
    
    await Promise.all(updatePromises);
    
    // Return updated tasks
    const updatedTasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: { tags: true, project: true, subtasks: true },
      orderBy: { order: 'asc' }
    });
    
    res.json(updatedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Tag routes
app.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({ include: { tasks: true } });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tags', async (req, res) => {
  try {
    const tag = await prisma.tag.create({
      data: req.body,
      include: { tasks: true }
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/tags/:id', async (req, res) => {
  try {
    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: req.body,
      include: { tasks: true }
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/tags/:id', async (req, res) => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TaskSection routes
app.get('/task-sections', async (req, res) => {
  try {
    const sections = await prisma.taskSection.findMany({
      include: { tasks: true, project: true },
      orderBy: { order: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/task-sections', async (req, res) => {
  try {
    const section = await prisma.taskSection.create({
      data: req.body,
      include: { tasks: true, project: true }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/task-sections/:id', async (req, res) => {
  try {
    const section = await prisma.taskSection.update({
      where: { id: req.params.id },
      data: req.body,
      include: { tasks: true, project: true }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/task-sections/:id', async (req, res) => {
  try {
    // First update tasks to remove their sectionId
    await prisma.task.updateMany({
      where: { sectionId: req.params.id },
      data: { sectionId: null }
    });
    
    // Then delete the section
    await prisma.taskSection.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
