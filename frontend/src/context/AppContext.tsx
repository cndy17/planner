import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, Area, Tag, TaskSection, ViewType, AppState } from '../types';

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;
  reorderProjects: (reorderedProjects: Project[]) => Promise<void>;
  
  addProject: (project: Omit<Project, 'id' | 'tasks'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  addArea: (area: Omit<Area, 'id' | 'projects'>) => Promise<void>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  
  addTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  addTaskSection: (section: Omit<TaskSection, 'id'>) => Promise<void>;
  updateTaskSection: (id: string, updates: Partial<TaskSection>) => Promise<void>;
  deleteTaskSection: (id: string) => Promise<void>;
  
  setSelectedView: (view: ViewType) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsQuickEntryOpen: (isOpen: boolean) => void;
  setIsSearchModalOpen: (isOpen: boolean) => void;
  setIsTaskFormOpen: (isOpen: boolean) => void;
  setEditingTaskId: (id: string | null) => void;
  openTaskFormForSection: (projectId: string, sectionId: string) => void;
  taskFormDefaults: { projectId?: string; sectionId?: string };
  
  getTasksByView: (view: ViewType) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByTag: (tagId: string) => Task[];
  getTasksBySection: (sectionId: string) => Task[];
  getSectionsByProject: (projectId: string) => TaskSection[];
  getProjectsByArea: (areaId: string) => Project[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const API_URL = 'http://localhost:3004';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    tasks: [],
    projects: [],
    areas: [],
    tags: [],
    taskSections: [],
    selectedView: 'today',
    selectedProjectId: null,
    selectedAreaId: null,
    selectedTagId: null,
    searchQuery: '',
    isQuickEntryOpen: false,
    isSearchModalOpen: false,
    isTaskFormOpen: false,
    editingTaskId: null,
  });

  // State for pre-populating task form modal
  const [taskFormDefaults, setTaskFormDefaults] = useState<{
    projectId?: string;
    sectionId?: string;
  }>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, projectsRes, tasksRes, tagsRes, taskSectionsRes] = await Promise.all([
          fetch(`${API_URL}/areas`),
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/tasks`),
          fetch(`${API_URL}/tags`),
          fetch(`${API_URL}/task-sections`),
        ]);

        const [areas, projects, tasks, tags, taskSections] = await Promise.all([
          areasRes.json(),
          projectsRes.json(),
          tasksRes.json(),
          tagsRes.json(),
          taskSectionsRes.json(),
        ]);

        setState(prev => ({
          ...prev,
          areas,
          projects,
          tasks,
          tags,
          taskSections,
        }));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Task operations
  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const newTask = await response.json();
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTask = await response.json();
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === id ? updatedTask : task
        ),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTask(id, { status: newStatus });
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    try {
      console.log('AppContext reorderTasks called with:', reorderedTasks.map(t => t.title));
      
      // Update local state immediately for responsive UI
      setState(prev => {
        // Create a map of reordered tasks with new order values
        const taskOrderMap = new Map();
        reorderedTasks.forEach((task, index) => {
          taskOrderMap.set(task.id, (index + 1) * 1000);
        });
        
        // First, update the order values for the reordered tasks
        const updatedReorderedTasks = reorderedTasks.map((task, index) => ({
          ...task,
          order: (index + 1) * 1000
        }));
        
        // Get the IDs of reordered tasks
        const reorderedTaskIds = new Set(reorderedTasks.map(t => t.id));
        
        // Get all other tasks (not being reordered)
        const otherTasks = prev.tasks.filter(task => !reorderedTaskIds.has(task.id));
        
        // Combine: other tasks + newly ordered tasks
        const allTasks = [...otherTasks, ...updatedReorderedTasks];
        
        console.log('AppContext: Updated local state with reordered tasks');
        return { ...prev, tasks: allTasks };
      });

      console.log('AppContext: Starting backend updates...');
      // Update backend asynchronously
      for (let i = 0; i < reorderedTasks.length; i++) {
        const task = reorderedTasks[i];
        const newOrder = (i + 1) * 1000;
        
        console.log(`AppContext: Task "${task.title}" - current order: ${task.order}, new order: ${newOrder}, needs update: ${task.order !== newOrder}`);
        
        if (task.order !== newOrder) {
          try {
            console.log(`AppContext: Updating "${task.title}" order from ${task.order} to ${newOrder}`);
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: newOrder }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log(`AppContext: Successfully updated "${task.title}"`);
          } catch (error) {
            console.error(`AppContext: Failed to update "${task.title}":`, error);
          }
        } else {
          console.log(`AppContext: Skipping "${task.title}" - order unchanged`);
        }
      }
      
    } catch (error) {
      console.error('AppContext: Failed to reorder tasks:', error);
    }
  };

  const reorderProjects = async (reorderedProjects: Project[]) => {
    try {
      console.log('AppContext reorderProjects called with:', reorderedProjects.map(p => p.name));
      
      // Update local state immediately for responsive UI
      setState(prev => {
        // Update the order values for the reordered projects
        const updatedReorderedProjects = reorderedProjects.map((project, index) => ({
          ...project,
          order: index
        }));
        
        // Get the IDs of reordered projects
        const reorderedProjectIds = new Set(reorderedProjects.map(p => p.id));
        
        // Get all other projects (not being reordered)
        const otherProjects = prev.projects.filter(project => !reorderedProjectIds.has(project.id));
        
        // Combine: other projects + newly ordered projects
        const allProjects = [...otherProjects, ...updatedReorderedProjects];
        
        console.log('AppContext: Updated local state with reordered projects');
        return { ...prev, projects: allProjects };
      });

      // Update backend with new order
      const response = await fetch(`${API_URL}/projects/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: reorderedProjects.map(p => p.id) }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('AppContext: Successfully reordered projects');
      
    } catch (error) {
      console.error('AppContext: Failed to reorder projects:', error);
    }
  };

  // Project operations
  const addProject = async (project: Omit<Project, 'id' | 'tasks'>) => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const newProject = await response.json();
      setState(prev => ({
        ...prev,
        projects: [...prev.projects, newProject],
      }));
      // Refresh areas to update project counts
      const areasRes = await fetch(`${API_URL}/areas`);
      const areas = await areasRes.json();
      setState(prev => ({ ...prev, areas }));
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedProject = await response.json();
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(project =>
          project.id === id ? updatedProject : project
        ),
      }));
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(project => project.id !== id),
        tasks: prev.tasks.filter(task => task.projectId !== id),
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Area operations
  const addArea = async (area: Omit<Area, 'id' | 'projects'>) => {
    try {
      const response = await fetch(`${API_URL}/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(area),
      });
      const newArea = await response.json();
      setState(prev => ({
        ...prev,
        areas: [...prev.areas, newArea],
      }));
    } catch (error) {
      console.error('Failed to add area:', error);
    }
  };

  const updateArea = async (id: string, updates: Partial<Area>) => {
    try {
      const response = await fetch(`${API_URL}/areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedArea = await response.json();
      setState(prev => ({
        ...prev,
        areas: prev.areas.map(area =>
          area.id === id ? updatedArea : area
        ),
      }));
    } catch (error) {
      console.error('Failed to update area:', error);
    }
  };

  const deleteArea = async (id: string) => {
    try {
      await fetch(`${API_URL}/areas/${id}`, {
        method: 'DELETE',
      });
      setState(prev => ({
        ...prev,
        areas: prev.areas.filter(area => area.id !== id),
        projects: prev.projects.filter(project => project.areaId !== id),
      }));
    } catch (error) {
      console.error('Failed to delete area:', error);
    }
  };

  // Tag operations
  const addTag = async (tag: Omit<Tag, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });
      const newTag = await response.json();
      setState(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      const response = await fetch(`${API_URL}/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTag = await response.json();
      setState(prev => ({
        ...prev,
        tags: prev.tags.map(tag =>
          tag.id === id ? updatedTag : tag
        ),
      }));
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await fetch(`${API_URL}/tags/${id}`, {
        method: 'DELETE',
      });
      setState(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // View helpers
  const getTasksByView = (view: ViewType): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (view) {
      case 'today':
        return state.tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      case 'upcoming':
        return state.tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < nextWeek;
        });
      case 'anytime':
        return state.tasks.filter(task => !task.dueDate);
      case 'someday':
        return state.tasks.filter(task => task.status === 'pending' && !task.dueDate);
      case 'logbook':
        return state.tasks.filter(task => task.status === 'completed');
      case 'calendar':
        return state.tasks;
      default:
        return state.tasks;
    }
  };

  const getTasksByProject = (projectId: string): Task[] => {
    return state.tasks.filter(task => task.projectId === projectId);
  };

  const getTasksByTag = (tagId: string): Task[] => {
    return state.tasks.filter(task => 
      task.tags.some(tag => tag.id === tagId)
    );
  };

  const getProjectsByArea = (areaId: string): Project[] => {
    return state.projects.filter(project => project.areaId === areaId);
  };

  const getTasksBySection = (sectionId: string): Task[] => {
    return state.tasks.filter(task => task.sectionId === sectionId);
  };

  const getSectionsByProject = (projectId: string): TaskSection[] => {
    return state.taskSections.filter(section => section.projectId === projectId);
  };

  // Task Section operations
  const addTaskSection = async (section: Omit<TaskSection, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/task-sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(section),
      });

      if (!response.ok) {
        throw new Error('Failed to create task section');
      }

      const newSection = await response.json();
      setState(prev => ({
        ...prev,
        taskSections: [...prev.taskSections, newSection],
      }));
    } catch (error) {
      console.error('Failed to add task section:', error);
    }
  };

  const updateTaskSection = async (id: string, updates: Partial<TaskSection>) => {
    try {
      const response = await fetch(`${API_URL}/task-sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task section');
      }

      const updatedSection = await response.json();
      setState(prev => ({
        ...prev,
        taskSections: prev.taskSections.map(section =>
          section.id === id ? updatedSection : section
        ),
      }));
    } catch (error) {
      console.error('Failed to update task section:', error);
    }
  };

  const deleteTaskSection = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/task-sections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task section');
      }

      setState(prev => ({
        ...prev,
        taskSections: prev.taskSections.filter(section => section.id !== id),
        // Move tasks in this section to unsectioned
        tasks: prev.tasks.map(task =>
          task.sectionId === id ? { ...task, sectionId: null } : task
        ),
      }));
    } catch (error) {
      console.error('Failed to delete task section:', error);
    }
  };

  // UI state setters
  const setSelectedView = (view: ViewType) => setState(prev => ({ ...prev, selectedView: view }));
  const setSelectedProjectId = (id: string | null) => setState(prev => ({ ...prev, selectedProjectId: id }));
  const setSelectedAreaId = (id: string | null) => setState(prev => ({ ...prev, selectedAreaId: id }));
  const setSelectedTagId = (id: string | null) => setState(prev => ({ ...prev, selectedTagId: id }));
  const setSearchQuery = (query: string) => setState(prev => ({ ...prev, searchQuery: query }));
  const setIsQuickEntryOpen = (isOpen: boolean) => setState(prev => ({ ...prev, isQuickEntryOpen: isOpen }));
  const setIsSearchModalOpen = (isOpen: boolean) => setState(prev => ({ ...prev, isSearchModalOpen: isOpen }));
  const setIsTaskFormOpen = (isOpen: boolean) => setState(prev => ({ ...prev, isTaskFormOpen: isOpen }));
  const setEditingTaskId = (id: string | null) => setState(prev => ({ ...prev, editingTaskId: id }));

  const openTaskFormForSection = (projectId: string, sectionId: string) => {
    setTaskFormDefaults({ projectId, sectionId });
    setEditingTaskId(null);
    setIsTaskFormOpen(true);
  };

  const value: AppContextType = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    reorderProjects,
    addProject,
    updateProject,
    deleteProject,
    addArea,
    updateArea,
    deleteArea,
    addTag,
    updateTag,
    deleteTag,
    addTaskSection,
    updateTaskSection,
    deleteTaskSection,
    setSelectedView,
    setSelectedProjectId,
    setSelectedAreaId,
    setSelectedTagId,
    setSearchQuery,
    setIsQuickEntryOpen,
    setIsSearchModalOpen,
    setIsTaskFormOpen,
    setEditingTaskId,
    openTaskFormForSection,
    taskFormDefaults,
    getTasksByView,
    getTasksByProject,
    getTasksByTag,
    getTasksBySection,
    getSectionsByProject,
    getProjectsByArea,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};