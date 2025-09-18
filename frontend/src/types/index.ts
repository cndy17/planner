export interface TaskSection {
  id: string;
  title: string;
  projectId: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueDate?: Date | null;
  reminderTime?: Date | null;
  startDate?: Date | null;
  status: 'pending' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | null;
  flagged: boolean;
  parentTaskId?: string | null;
  projectId?: string | null;
  sectionId?: string | null;
  tags: Tag[];
  subtasks?: Task[];
  recurrence?: string | null;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  deadline?: Date | null;
  order?: number;
  areaId?: string | null;
  area?: Area | null;
  tasks: Task[];
  completedTasksCount?: number;
  totalTasksCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Area {
  id: string;
  name: string;
  color: string;
  projects: Project[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  tasks?: Task[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  description?: string;
}

export type ViewType = 'today' | 'upcoming' | 'anytime' | 'someday' | 'logbook' | 'calendar' | 'planner';
export type SidebarSection = 'areas' | 'projects' | 'tags';

export interface AppState {
  tasks: Task[];
  projects: Project[];
  areas: Area[];
  tags: Tag[];
  taskSections: TaskSection[];
  selectedView: ViewType;
  selectedProjectId?: string | null;
  selectedAreaId?: string | null;
  selectedTagId?: string | null;
  searchQuery: string;
  isQuickEntryOpen: boolean;
  isSearchModalOpen: boolean;
  isTaskFormOpen: boolean;
  editingTaskId?: string | null;
}