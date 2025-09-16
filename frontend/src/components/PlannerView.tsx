import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from './TaskCard';
import { CalendarEvent, Task } from '../types';
import { 
  Calendar, 
  Clock, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
  CalendarDays,
  Plus
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface PlannerViewProps {
  view: 'today' | 'upcoming';
  hideCompletedTasks?: boolean;
}

const PlannerView: React.FC<PlannerViewProps> = ({ view, hideCompletedTasks = false }) => {
  const { tasks, setIsQuickEntryOpen } = useApp();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock calendar events (in real app, would fetch from calendar API)
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Team Standup',
        startTime: new Date(new Date().setHours(9, 0, 0, 0)),
        endTime: new Date(new Date().setHours(9, 30, 0, 0)),
        allDay: false,
        location: 'Zoom',
      },
      {
        id: '2',
        title: 'Lunch with Client',
        startTime: new Date(new Date().setHours(12, 30, 0, 0)),
        endTime: new Date(new Date().setHours(13, 30, 0, 0)),
        allDay: false,
        location: 'Downtown Cafe',
      },
    ];
    setCalendarEvents(mockEvents);
  }, []);

  const getTasksForView = (): Task[] => {
    const today = startOfDay(new Date());
    
    if (view === 'today') {
      const tomorrow = startOfDay(addDays(today, 1));
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return isWithinInterval(dueDate, { start: today, end: tomorrow });
      });
    } else {
      const nextWeek = endOfDay(addDays(today, 7));
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return isWithinInterval(dueDate, { start: today, end: nextWeek });
      });
    }
  };

  const categorizeTasksByTimeOfDay = (dayTasks: Task[]) => {
    const morning: Task[] = [];
    const afternoon: Task[] = [];
    const evening: Task[] = [];
    const anytime: Task[] = [];

    dayTasks.forEach(task => {
      if (!task.startDate) {
        anytime.push(task);
      } else {
        const hour = new Date(task.startDate).getHours();
        if (hour < 12) morning.push(task);
        else if (hour < 17) afternoon.push(task);
        else evening.push(task);
      }
    });

    return { morning, afternoon, evening, anytime };
  };

  const todayTasks = getTasksForView();
  const { morning, afternoon, evening, anytime } = categorizeTasksByTimeOfDay(todayTasks);

  const getUpcomingDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = startOfDay(new Date(task.dueDate));
        return dueDate.getTime() === startOfDay(date).getTime();
      });
      if (dayTasks.length > 0 || i === 0) {
        days.push({ date, tasks: dayTasks });
      }
    }
    return days;
  };

  const TimeSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    tasks: Task[];
    events?: CalendarEvent[];
  }> = ({ title, icon, tasks, events = [] }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs text-gray-400">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          {events.length > 0 && `, ${events.length} ${events.length === 1 ? 'event' : 'events'}`}
        </span>
      </div>
      
      {/* Calendar Events */}
      {events.map(event => (
        <div
          key={event.id}
          className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-800">{event.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    📍 {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Tasks */}
      <div className="space-y-1">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && events.length === 0 && (
          <p className="text-gray-400 text-sm py-2">No items scheduled</p>
        )}
      </div>
    </div>
  );

  if (view === 'today') {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Current Time */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary-800">
                  {format(currentTime, 'EEEE, MMMM d')}
                </h2>
                <p className="text-primary-600 mt-1">
                  {format(currentTime, 'h:mm a')}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          {/* Time-based Sections */}
          <TimeSection
            title="Morning"
            icon={<Sunrise className="w-4 h-4 text-orange-500" />}
            tasks={morning}
            events={calendarEvents.filter(e => e.startTime.getHours() < 12)}
          />
          
          <TimeSection
            title="Afternoon"
            icon={<Sun className="w-4 h-4 text-yellow-500" />}
            tasks={afternoon}
            events={calendarEvents.filter(e => e.startTime.getHours() >= 12 && e.startTime.getHours() < 17)}
          />
          
          <TimeSection
            title="Evening"
            icon={<Sunset className="w-4 h-4 text-purple-500" />}
            tasks={evening}
            events={calendarEvents.filter(e => e.startTime.getHours() >= 17)}
          />
          
          <TimeSection
            title="Anytime Today"
            icon={<Clock className="w-4 h-4 text-gray-500" />}
            tasks={anytime}
          />

          {/* Add Task Button */}
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task for Today</span>
          </button>
        </div>
      </div>
    );
  }

  // Upcoming View
  const upcomingDays = getUpcomingDays();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">Next 7 Days</h2>
        </div>

        {upcomingDays.map(({ date, tasks }) => {
          const dateLabel = isToday(date) 
            ? 'Today' 
            : isTomorrow(date) 
            ? 'Tomorrow' 
            : format(date, 'EEEE, MMM d');

          return (
            <div key={date.toISOString()} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-700">{dateLabel}</h3>
                <span className="text-sm text-gray-500">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              
              <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-400 text-sm py-2">No tasks scheduled</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlannerView;