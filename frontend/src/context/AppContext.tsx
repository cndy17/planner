import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, Area, Tag, ViewType, AppState } from '../types';

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  
  addProject: (project: Omit<Project, 'id' | 'tasks'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  addArea: (area: Omit<Area, 'id' | 'projects'>) => Promise<void>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  
  addTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  setSelectedView: (view: ViewType) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsQuickEntryOpen: (isOpen: boolean) => void;
  setIsSearchModalOpen: (isOpen: boolean) => void;
  setIsTaskFormOpen: (isOpen: boolean) => void;
  setEditingTaskId: (id: string | null) => void;
  
  getTasksByView: (view: ViewType) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByTag: (tagId: string) => Task[];
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

const API_URL = 'http://localhost:4000';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    tasks: [],
    projects: [],
    areas: [],
    tags: [],
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, projectsRes, tasksRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/areas`),
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/tasks`),
          fetch(`${API_URL}/tags`),
        ]);

        const [areas, projects, tasks, tags] = await Promise.all([
          areasRes.json(),
          projectsRes.json(),
          tasksRes.json(),
          tagsRes.json(),
        ]);

        setState(prev => ({
          ...prev,
          areas,
          projects,
          tasks,
          tags,
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

  const reorderTasks = async (taskIds: string[]) => {
    try {
      // Update local state immediately with new order values
      setState(prev => {
        const taskMap = new Map(prev.tasks.map(task => [task.id, task]));
        const reorderedTasks = taskIds.map((id, index) => {
          const task = taskMap.get(id);
          return task ? { ...task, order: index + 1 } : null;
        }).filter(Boolean) as Task[];
        
        const otherTasks = prev.tasks
          .filter(task => !taskIds.includes(task.id))
          .map(task => ({ ...task, order: task.order })); // Keep existing order for non-reordered tasks
        
        return {
          ...prev,
          tasks: [...reorderedTasks, ...otherTasks],
        };
      });

      // Persist to backend
      try {
        const response = await fetch(`${API_URL}/tasks/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds }),
        });
        
        if (!response.ok) {
          throw new Error(`Backend reorder failed: ${response.statusText}`);
        }
        
        console.log('Tasks reordered successfully');
      } catch (backendError) {
        console.warn('Backend reorder failed, but local state updated:', backendError);
        // Local state is already updated, so UI will still work
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
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

  const value: AppContextType = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    addProject,
    updateProject,
    deleteProject,
    addArea,
    updateArea,
    deleteArea,
    addTag,
    updateTag,
    deleteTag,
    setSelectedView,
    setSelectedProjectId,
    setSelectedAreaId,
    setSelectedTagId,
    setSearchQuery,
    setIsQuickEntryOpen,
    setIsSearchModalOpen,
    setIsTaskFormOpen,
    setEditingTaskId,
    getTasksByView,
    getTasksByProject,
    getTasksByTag,
    getProjectsByArea,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};