import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Project, Area } from '../types';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { CheckCircle, Clock, Plus, Folder, Square, Archive } from 'lucide-react';

interface LogbookViewProps {
  hideCompletedTasks?: boolean;
}

interface LogEntry {
  id: string;
  type: 'task_created' | 'task_completed' | 'project_created' | 'area_created';
  timestamp: Date;
  item: Task | Project | Area;
  title: string;
  subtitle?: string;
}

const LogbookView: React.FC<LogbookViewProps> = ({ hideCompletedTasks = false }) => {
  const { tasks, projects, areas } = useApp();
  
  const logEntries = useMemo(() => {
    const entries: LogEntry[] = [];

    // Add task creations
    tasks.forEach(task => {
      if (task.createdAt) {
        entries.push({
          id: `task_created_${task.id}`,
          type: 'task_created',
          timestamp: new Date(task.createdAt),
          item: task,
          title: `Created task: ${task.title}`,
          subtitle: task.projectId ? 'In project' : undefined
        });
      }
    });

    // Add task completions
    tasks.filter(task => task.status === 'completed').forEach(task => {
      if (task.updatedAt) {
        entries.push({
          id: `task_completed_${task.id}`,
          type: 'task_completed',
          timestamp: new Date(task.updatedAt),
          item: task,
          title: `Completed task: ${task.title}`,
          subtitle: task.projectId ? 'In project' : undefined
        });
      }
    });

    // Add project creations
    projects.forEach(project => {
      if (project.createdAt) {
        entries.push({
          id: `project_created_${project.id}`,
          type: 'project_created',
          timestamp: new Date(project.createdAt),
          item: project,
          title: `Created project: ${project.name}`,
          subtitle: project.area?.name ? `In area: ${project.area.name}` : undefined
        });
      }
    });

    // Add area creations
    areas.forEach(area => {
      if (area.createdAt) {
        entries.push({
          id: `area_created_${area.id}`,
          type: 'area_created',
          timestamp: new Date(area.createdAt),
          item: area,
          title: `Created area: ${area.name}`,
        });
      }
    });

    // Sort by timestamp (most recent first)
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [tasks, projects, areas]);

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE \'at\' h:mm a');
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const getLogEntryIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'task_created':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'project_created':
        return <Folder className="w-4 h-4 text-purple-500" />;
      case 'area_created':
        return <Archive className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogEntryColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'task_created':
        return 'border-l-blue-500 bg-blue-50';
      case 'task_completed':
        return 'border-l-green-500 bg-green-50';
      case 'project_created':
        return 'border-l-purple-500 bg-purple-50';
      case 'area_created':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  if (logEntries.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No activity yet</h3>
            <p className="text-gray-500">Activity will appear here as you create tasks, projects, and areas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Activity Log</h2>
          <p className="text-sm text-gray-600">
            {logEntries.length} activit{logEntries.length !== 1 ? 'ies' : 'y'} recorded
          </p>
        </div>

        <div className="space-y-3">
          {logEntries.map((entry) => (
            <div 
              key={entry.id} 
              className={`border-l-4 rounded-r-lg p-4 ${getLogEntryColor(entry.type)} hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogEntryIcon(entry.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {entry.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  {entry.subtitle && (
                    <p className="text-xs text-gray-600 mt-1">
                      {entry.subtitle}
                    </p>
                  )}
                  
                  {/* Task-specific details */}
                  {(entry.type === 'task_created' || entry.type === 'task_completed') && (
                    <div className="mt-2">
                      {(entry.item as Task).notes && (
                        <p className="text-xs text-gray-500 italic line-clamp-2">
                          {(entry.item as Task).notes}
                        </p>
                      )}
                      {(entry.item as Task).tags && (entry.item as Task).tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(entry.item as Task).tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${tag.color}15`,
                                color: tag.color,
                                border: `1px solid ${tag.color}30`
                              }}
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Area-specific details */}
                  {entry.type === 'area_created' && (
                    <div className="mt-2">
                      <div 
                        className="inline-block w-3 h-3 rounded"
                        style={{ backgroundColor: (entry.item as Area).color }}
                      ></div>
                      <span className="text-xs text-gray-600 ml-2">
                        Color: {(entry.item as Area).color}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogbookView;