import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { X, Calendar, Clock, Flag, Hash, Folder, Repeat } from 'lucide-react';
import { format } from 'date-fns';

const QuickEntryModal: React.FC = () => {
  const {
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    addTask,
    projects,
    tags,
    selectedProjectId,
  } = useApp();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [projectId, setProjectId] = useState<string>(selectedProjectId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [recurrence, setRecurrence] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickEntryOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isQuickEntryOpen]);

  useEffect(() => {
    setProjectId(selectedProjectId || '');
  }, [selectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Omit<Task, 'id'> = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderTime: reminderTime ? new Date(reminderTime) : null,
      startDate: null,
      status: 'pending',
      priority,
      flagged,
      projectId: projectId || null,
      tags: tags.filter(t => selectedTags.includes(t.id)),
      recurrence: recurrence || null,
      order: 0,
    };

    await addTask(newTask);
    handleClose();
  };

  const handleClose = () => {
    setIsQuickEntryOpen(false);
    setTitle('');
    setNotes('');
    setDueDate('');
    setReminderTime('');
    setProjectId(selectedProjectId || '');
    setSelectedTags([]);
    setPriority(null);
    setFlagged(false);
    setRecurrence('');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (!isQuickEntryOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">New Task</h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (supports Markdown)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3">
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

              {/* Project */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Folder className="w-4 h-4" />
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
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
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(priority === p ? null : p)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
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
                  className={`px-3 py-1 rounded-lg border transition-colors ${
                    flagged
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="w-4 h-4" />
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
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickEntryModal;