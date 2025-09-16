import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Task, ViewType } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskListSimple from './TaskListSimple';
import ProjectView from './ProjectView';
import AreaView from './AreaView';
import PlannerView from './PlannerView';
import CalendarView from './CalendarView';
import QuickEntryModal from './modals/QuickEntryModal';
import SearchModal from './modals/SearchModal';
import TaskFormModal from './modals/TaskFormModal';
import TagFormModal from './modals/TagFormModal';
import AreaModal from './modals/AreaModal';
import { Plus, Calendar, Search, Tag, ArrowLeft, ArrowRight } from 'lucide-react';

const AppLayout: React.FC = () => {
  const {
    selectedView,
    selectedProjectId,
    selectedAreaId,
    getTasksByView,
    setIsSearchModalOpen,
    setIsQuickEntryOpen,
    setSelectedView,
    setSelectedProjectId,
    setSelectedAreaId,
    reorderTasks,
    addArea,
    areas,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
  
  // Navigation history
  const [navigationHistory, setNavigationHistory] = useState<Array<{
    view: string;
    projectId?: string | null;
    areaId?: string | null;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Get tasks for current view and manage them locally
  const viewTasks = getTasksByView(selectedView);

  const handleReorder = async (reorderedTasks: Task[]) => {
    console.log('AppLayout handleReorder called with tasks:', reorderedTasks.map(t => t.title));
    await reorderTasks(reorderedTasks);
  };

  const handleAddArea = () => {
    setEditingArea(null);
    setIsAreaModalOpen(true);
  };

  const handleEditArea = (area: any) => {
    setEditingArea(area);
    setIsAreaModalOpen(true);
  };

  // Navigation functions
  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = navigationHistory[newIndex];
      setHistoryIndex(newIndex);
      
      // Navigate to previous state
      if (previousState.projectId) {
        setSelectedProjectId(previousState.projectId);
      } else if (previousState.areaId) {
        setSelectedAreaId(previousState.areaId);
      } else {
        setSelectedView(previousState.view as ViewType);
      }
    }
  };

  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = navigationHistory[newIndex];
      setHistoryIndex(newIndex);
      
      // Navigate to next state
      if (nextState.projectId) {
        setSelectedProjectId(nextState.projectId);
      } else if (nextState.areaId) {
        setSelectedAreaId(nextState.areaId);
      } else {
        setSelectedView(nextState.view as ViewType);
      }
    }
  };

  // Track navigation history
  useEffect(() => {
    const currentState = {
      view: selectedView,
      projectId: selectedProjectId,
      areaId: selectedAreaId,
    };

    // Don't add duplicate states
    const lastState = navigationHistory[historyIndex];
    const isDifferent = !lastState || 
      lastState.view !== currentState.view ||
      lastState.projectId !== currentState.projectId ||
      lastState.areaId !== currentState.areaId;

    if (isDifferent) {
      const newHistory = navigationHistory.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      setNavigationHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [selectedView, selectedProjectId, selectedAreaId]);

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

  const renderMainContent = useCallback(() => {
    // Project View
    if (selectedProjectId) {
      return <ProjectView projectId={selectedProjectId} hideCompletedTasks={hideCompletedTasks} />;
    }

    // Area View
    if (selectedAreaId) {
      return <AreaView areaId={selectedAreaId} hideCompletedTasks={hideCompletedTasks} />;
    }

    // Planner Views (Today/Upcoming)
    if (selectedView === 'today' || selectedView === 'upcoming') {
      return <PlannerView view={selectedView} hideCompletedTasks={hideCompletedTasks} />;
    }

    // Calendar View
    if (selectedView === 'calendar') {
      return <CalendarView hideCompletedTasks={hideCompletedTasks} />;
    }

    // Default Task List View
    const sortedTasks = [...viewTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const pendingTasks = sortedTasks.filter(t => t.status === 'pending');
    const completedTasks = sortedTasks.filter(t => t.status === 'completed');

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Pending Tasks */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              To-Do ({pendingTasks.length})
            </h3>
            <TaskListSimple 
              tasks={pendingTasks} 
              onReorder={handleReorder}
            />
          </div>

          {/* Completed Tasks */}
          {!hideCompletedTasks && completedTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                Completed ({completedTasks.length})
              </h3>
              <div className="opacity-60">
                <TaskListSimple 
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
  }, [selectedProjectId, selectedAreaId, selectedView, viewTasks, hideCompletedTasks, handleReorder, setIsQuickEntryOpen]);

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
      <div className="flex-1 flex flex-col relative">
        <Header 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(!hideCompletedTasks)}
          onEditArea={handleEditArea}
        />
        <div className="flex-1 pb-14 overflow-y-auto custom-scrollbar">
          {renderMainContent()}
        </div>
      </div>

      {/* Bottom Menu Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between px-4 py-2 min-h-[48px]">
          {/* Left side - Add Area */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleAddArea}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors px-2 py-1"
              title="Add Area"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">Add Area</span>
            </button>
          </div>

          {/* Center - Main action buttons */}
          <div className="flex items-center gap-4 flex-1 justify-center max-w-md">
            {/* Add Task */}
            <button
              onClick={() => setIsQuickEntryOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Add Task"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Add Tag with Plus */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openTagModal'));
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors relative flex-shrink-0"
              title="Add Tag"
            >
              <div className="relative">
                <Tag className="w-5 h-5" />
                <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-white text-gray-500" />
              </div>
            </button>

            {/* Calendar */}
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Calendar"
            >
              <Calendar className="w-5 h-5" />
            </button>

            {/* Navigation Back */}
            <button
              onClick={navigateBack}
              disabled={historyIndex <= 0}
              className={`p-2 rounded transition-colors flex-shrink-0 ${
                historyIndex <= 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Navigation Forward */}
            <button
              onClick={navigateForward}
              disabled={historyIndex >= navigationHistory.length - 1}
              className={`p-2 rounded transition-colors flex-shrink-0 ${
                historyIndex >= navigationHistory.length - 1
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Forward"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right side - Search */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Search (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickEntryModal />
      <SearchModal />
      <TaskFormModal />
      <TagFormModal />
      <AreaModal 
        isOpen={isAreaModalOpen} 
        onClose={() => {
          setIsAreaModalOpen(false);
          setEditingArea(null);
        }}
        editingArea={editingArea}
      />
      <CalendarView isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} isModal={true} />
    </div>
  );
};

export default AppLayout;