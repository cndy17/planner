import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useApp } from '../context/AppContext';
import { Task, TaskSection } from '../types';
import DraggableTaskItem from './DraggableTaskItem';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';

interface SectionedTaskViewProps {
  projectId: string;
  hideCompletedTasks?: boolean;
}

const SectionedTaskView: React.FC<SectionedTaskViewProps> = ({ projectId, hideCompletedTasks = false }) => {
  const { 
    tasks, 
    taskSections, 
    reorderTasks,
    updateTask,
    addTaskSection,
    updateTaskSection,
    getSectionsByProject,
    getTasksBySection,
    addTask,
    setIsTaskFormOpen,
    setEditingTaskId,
    openTaskFormForSection
  } = useApp();
  
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isUnsectionedCollapsed, setIsUnsectionedCollapsed] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  
  // Inline task creation state
  const [addingTaskToSection, setAddingTaskToSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingToUnsectioned, setIsAddingToUnsectioned] = useState(false);

  const sections = getSectionsByProject(projectId);
  const allUnsectionedTasks = tasks.filter(t => t.projectId === projectId && !t.sectionId);
  const unsectionedTasks = hideCompletedTasks 
    ? allUnsectionedTasks.filter(task => task.status !== 'completed')
    : allUnsectionedTasks;

  
  // Create all task items for drag context (filtered if hiding completed)
  const allTasks = [
    ...unsectionedTasks,
    ...sections.flatMap(section => {
      const allSectionTasks = getTasksBySection(section.id);
      return hideCompletedTasks 
        ? allSectionTasks.filter(task => task.status !== 'completed')
        : allSectionTasks;
    })
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    const draggedTask = allTasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // Check if we're dropping on a section header
    const sectionDropMatch = over.id.toString().match(/^section-(.+)$/);
    if (sectionDropMatch) {
      const targetSectionId = sectionDropMatch[1];
      
      // Move task to target section
      console.log(`Moving task "${draggedTask.title}" to section ${targetSectionId}`);
      await updateTask(draggedTask.id, { sectionId: targetSectionId });
      return;
    }

    // Check if we're dropping on the unsectioned area
    if (over.id === 'unsectioned-area') {
      console.log(`Moving task "${draggedTask.title}" to unsectioned`);
      await updateTask(draggedTask.id, { sectionId: null });
      return;
    }

    // Handle reordering within the same section
    const overTask = allTasks.find(t => t.id === over.id);
    if (overTask && draggedTask.sectionId === overTask.sectionId) {
      // Get tasks in the same section
      const sectionTasks = draggedTask.sectionId 
        ? getTasksBySection(draggedTask.sectionId)
        : unsectionedTasks;
      
      const oldIndex = sectionTasks.findIndex(t => t.id === draggedTask.id);
      const newIndex = sectionTasks.findIndex(t => t.id === overTask.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(sectionTasks, oldIndex, newIndex);
        console.log('Reordering tasks within section');
        await reorderTasks(reorderedTasks);
      }
    }
  };

  const handleAddSection = async () => {
    if (newSectionTitle.trim()) {
      await addTaskSection({
        title: newSectionTitle.trim(),
        projectId: projectId,
        order: sections.length * 1000,
      });
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const startEditingSection = (section: TaskSection) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const saveSection = async () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      await updateTaskSection(editingSectionId, {
        title: editingSectionTitle.trim()
      });
      setEditingSectionId(null);
      setEditingSectionTitle('');
    }
  };

  const cancelEditingSection = () => {
    setEditingSectionId(null);
    setEditingSectionTitle('');
  };

  // Inline task creation functions
  const startAddingTaskToSection = (sectionId: string) => {
    setAddingTaskToSection(sectionId);
    setNewTaskTitle('');
  };

  const startAddingTaskToUnsectioned = () => {
    setIsAddingToUnsectioned(true);
    setNewTaskTitle('');
  };

  const saveNewTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle.trim(),
      status: 'pending' as const,
      projectId: projectId,
      sectionId: addingTaskToSection || (isAddingToUnsectioned ? null : null),
      order: 0,
      flagged: false,
      tags: [],
    };

    await addTask(newTask);
    
    // Reset state
    setNewTaskTitle('');
    setAddingTaskToSection(null);
    setIsAddingToUnsectioned(false);
  };

  const cancelAddingTask = () => {
    setNewTaskTitle('');
    setAddingTaskToSection(null);
    setIsAddingToUnsectioned(false);
  };

  const renderSection = (section: TaskSection) => {
    const allSectionTasks = getTasksBySection(section.id);
    const sectionTasks = hideCompletedTasks 
      ? allSectionTasks.filter(task => task.status !== 'completed')
      : allSectionTasks;
    const isCollapsed = collapsedSections.has(section.id);
    
    return (
      <div key={section.id} className="mb-6">
        {/* Section Header - Drop Zone */}
        <div 
          id={`section-${section.id}`}
          className="flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => toggleSection(section.id)}
              className="text-blue-600 hover:text-blue-700 flex-shrink-0"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {editingSectionId === section.id ? (
              <input
                type="text"
                value={editingSectionTitle}
                onChange={(e) => setEditingSectionTitle(e.target.value)}
                className="text-lg font-medium text-blue-600 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1"
                autoFocus
                onBlur={saveSection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveSection();
                  } else if (e.key === 'Escape') {
                    cancelEditingSection();
                  }
                }}
              />
            ) : (
              <span 
                className="text-lg font-medium text-blue-600 hover:text-blue-700 cursor-pointer px-1 rounded hover:bg-blue-100 transition-colors"
                onClick={() => startEditingSection(section)}
              >
                {section.title}
              </span>
            )}
            
            <span className="text-sm text-gray-500">({sectionTasks.length})</span>
          </div>
          
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Section Tasks */}
        {!isCollapsed && (
          <div className="ml-4 space-y-1">
            {sectionTasks.map(task => (
              <DraggableTaskItem
                key={task.id}
                task={task}
                showProject={false}
              />
            ))}
            
            {/* Add Task Button or Inline Input */}
            {addingTaskToSection === section.id ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveNewTask();
                    if (e.key === 'Escape') cancelAddingTask();
                  }}
                />
                <button
                  onClick={saveNewTask}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={cancelAddingTask}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => startAddingTaskToSection(section.id)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm mt-2"
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={allTasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {/* Existing Sections */}
          {sections.map(section => renderSection(section))}
          
          {/* Unsectioned Tasks */}
          {unsectionedTasks.length > 0 && (
            <div className="mb-6">
              <div 
                id="unsectioned-area"
                className="flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setIsUnsectionedCollapsed(!isUnsectionedCollapsed)}
                    className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                  >
                    {isUnsectionedCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  <span className="text-lg font-medium text-blue-600 hover:text-blue-700 cursor-pointer px-1 rounded hover:bg-blue-100 transition-colors">
                    Tasks
                  </span>
                  
                  <span className="text-sm text-gray-500">({unsectionedTasks.length})</span>
                </div>
                
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              {!isUnsectionedCollapsed && (
                <div className="ml-4 space-y-1">
                  {unsectionedTasks.map(task => (
                    <DraggableTaskItem
                      key={task.id}
                      task={task}
                      showProject={false}
                    />
                  ))}
                  
                  {/* Add Task to Unsectioned */}
                  {isAddingToUnsectioned ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveNewTask();
                          if (e.key === 'Escape') cancelAddingTask();
                        }}
                      />
                      <button
                        onClick={saveNewTask}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={cancelAddingTask}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={startAddingTaskToUnsectioned}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Add New Section */}
          <div className="border-t border-gray-200 pt-4">
            {isAddingSection ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Section title"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection();
                    if (e.key === 'Escape') {
                      setIsAddingSection(false);
                      setNewSectionTitle('');
                    }
                  }}
                />
                <button
                  onClick={handleAddSection}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingSection(false);
                    setNewSectionTitle('');
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSection(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add section
              </button>
            )}
          </div>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 shadow-2xl border border-blue-200 bg-white rounded-lg">
            <TaskCard 
              task={activeTask} 
              showProject={false}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SectionedTaskView;