import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskList from './TaskList';
import ProjectView from './ProjectView';
import AreaView from './AreaView';
import PlannerView from './PlannerView';
import CalendarView from './CalendarView';
import QuickEntryModal from './modals/QuickEntryModal';
import SearchModal from './modals/SearchModal';
import TaskFormModal from './modals/TaskFormModal';
import { Plus, Calendar, ListFilter, LayoutGrid, ArrowRight, Search } from 'lucide-react';

const AppLayout: React.FC = () => {
  const {
    selectedView,
    selectedProjectId,
    selectedAreaId,
    getTasksByView,
    setIsSearchModalOpen,
    setIsQuickEntryOpen,
    tasks,
    updateTask,
    reorderTasks,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Task ordering state
  const viewTasks = getTasksByView(selectedView);
  const [orderedTasks, setOrderedTasks] = useState(() => 
    [...viewTasks].sort((a, b) => (a.order || 0) - (b.order || 0))
  );
  
  // Only update when view changes or when tasks are added/removed (not reordered)
  React.useEffect(() => {
    const sortedViewTasks = [...viewTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    setOrderedTasks(sortedViewTasks);
  }, [selectedView, selectedProjectId, selectedAreaId, tasks.length]);

  const handleReorder = async (reorderedTasks: Task[]) => {
    // Update local state immediately for instant visual feedback
    setOrderedTasks(reorderedTasks);
    
    // Persist order to backend
    const taskIds = reorderedTasks.map(task => task.id);
    await reorderTasks(taskIds);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      // Cmd/Ctrl + N for new task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsQuickEntryOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchModalOpen, setIsQuickEntryOpen]);

  const renderMainContent = () => {
    // Project View
    if (selectedProjectId) {
      return <ProjectView projectId={selectedProjectId} />;
    }

    // Area View
    if (selectedAreaId) {
      return <AreaView areaId={selectedAreaId} />;
    }

    // Planner Views (Today/Upcoming)
    if (selectedView === 'today' || selectedView === 'upcoming') {
      return <PlannerView view={selectedView} />;
    }

    // Default Task List View
    const pendingTasks = orderedTasks.filter(t => t.status === 'pending');
    const completedTasks = orderedTasks.filter(t => t.status === 'completed');

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Pending Tasks */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              To-Do ({pendingTasks.length})
            </h3>
            <TaskList 
              tasks={pendingTasks} 
              onReorder={handleReorder}
            />
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                Completed ({completedTasks.length})
              </h3>
              <div className="opacity-60">
                <TaskList 
                  tasks={completedTasks}
                  onReorder={handleReorder}
                />
              </div>
            </div>
          )}

          {/* Add Task Button */}
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-transform lg:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 overflow-hidden pb-14">
          {renderMainContent()}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickEntryOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Task (⌘N)"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filter"
            >
              <ListFilter className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add Widget"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Calendar View"
            >
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Move to"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search (⌘K)"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickEntryModal />
      <SearchModal />
      <TaskFormModal />
      <CalendarView isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};

export default AppLayout;