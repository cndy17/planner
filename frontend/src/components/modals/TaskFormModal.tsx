import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { X, Calendar, Clock, Flag, Hash, Folder, Repeat, Plus, Trash2 } from 'lucide-react';

const TaskFormModal: React.FC = () => {
  const {
    isTaskFormOpen,
    setIsTaskFormOpen,
    editingTaskId,
    setEditingTaskId,
    tasks,
    updateTask,
    addTask,
    deleteTask,
    projects,
    tags,
    getSectionsByProject,
    taskFormDefaults,
  } = useApp();

  const editingTask = tasks.find(t => t.id === editingTaskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [plannedDate, setPlannedDate] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [recurrence, setRecurrence] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Array<{ id?: string; title: string; completed: boolean }>>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTaskFormOpen) {
      if (editingTask) {
        // Editing existing task
        setTitle(editingTask.title);
        setNotes(editingTask.notes || '');
        setDueDate(editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '');
        setReminderTime(editingTask.reminderTime ? new Date(editingTask.reminderTime).toISOString().slice(0, 16) : '');
        setStartDate(editingTask.startDate ? new Date(editingTask.startDate).toISOString().split('T')[0] : '');
        setPlannedDate(editingTask.plannedDate ? new Date(editingTask.plannedDate).toISOString().split('T')[0] : '');
        setProjectId(editingTask.projectId || '');
        setSectionId(editingTask.sectionId || '');
        setSelectedTags(editingTask.tags.map(t => t.id));
        setPriority(editingTask.priority || null);
        setFlagged(editingTask.flagged);
        setRecurrence(editingTask.recurrence || '');
        setSubtasks(editingTask.subtasks?.map(st => ({
          id: st.id,
          title: st.title,
          completed: st.status === 'completed'
        })) || []);
      } else {
        // Creating new task - use defaults from context
        setProjectId(taskFormDefaults.projectId || '');
        setSectionId(taskFormDefaults.sectionId || '');
      }
    }
  }, [isTaskFormOpen, editingTask, taskFormDefaults]);

  useEffect(() => {
    if (isTaskFormOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTaskFormOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Partial<Task> = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderTime: reminderTime ? new Date(reminderTime) : null,
      startDate: startDate ? new Date(startDate) : null,
      plannedDate: plannedDate ? new Date(plannedDate) : null,
      priority,
      flagged,
      projectId: projectId || null,
      sectionId: sectionId || null,
      tags: tags.filter(t => selectedTags.includes(t.id)),
      recurrence: recurrence || null,
    };

    if (editingTaskId) {
      await updateTask(editingTaskId, taskData);
    } else {
      await addTask({ ...taskData, status: 'pending', order: 0 } as Omit<Task, 'id'>);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsTaskFormOpen(false);
    setEditingTaskId(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setDueDate('');
    setReminderTime('');
    setStartDate('');
    setPlannedDate('');
    setProjectId('');
    setSectionId('');
    setSelectedTags([]);
    setPriority(null);
    setFlagged(false);
    setRecurrence('');
    setSubtasks([]);
    setNewSubtask('');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    setSubtasks(updated);
  };

  const handleDelete = () => {
    if (editingTaskId && window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(editingTaskId);
      handleClose();
    }
  };

  if (!isTaskFormOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingTaskId ? 'Edit Task' : 'New Task'}
            </h2>
            <div className="flex items-center gap-2">
              {editingTaskId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2 text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />

            {/* Notes */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (supports Markdown)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={4}
              />
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Subtasks</label>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(index)}
                      className="rounded"
                    />
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => {
                        const updated = [...subtasks];
                        updated[index].title = e.target.value;
                        setSubtasks(updated);
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add subtask..."
                    className="flex-1 px-2 py-1 border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="p-1 bg-primary-100 hover:bg-primary-200 rounded"
                  >
                    <Plus className="w-4 h-4 text-primary-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Planned Date */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Hash className="w-4 h-4" />
                  Planned Date
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Reminder
                </label>
                <input
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Project, Section and Recurrence */}
            <div className="grid grid-cols-3 gap-3">
              {/* Project */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Folder className="w-4 h-4" />
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setSectionId(''); // Clear section when project changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Folder className="w-4 h-4" />
                  Section
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!projectId}
                >
                  <option value="">No Section</option>
                  {projectId && getSectionsByProject(projectId).map(section => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurrence */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Repeat className="w-4 h-4" />
                  Repeat
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Priority & Flag</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(priority === p ? null : p)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : p === 'medium'
                          ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                          : 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFlagged(!flagged)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    flagged
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  Flag
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Hash className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {editingTaskId ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;