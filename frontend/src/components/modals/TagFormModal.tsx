import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Tag } from 'lucide-react';

const TagFormModal: React.FC = () => {
  const {
    addTag,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const inputRef = useRef<HTMLInputElement>(null);

  // Color options for tags
  const colorOptions = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#F97316', // orange
    '#6B7280', // gray
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addTag({
        name: name.trim(),
        color,
      });

      // Reset form
      setName('');
      setColor('#3B82F6');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setName('');
    setColor('#3B82F6');
  };

  // Allow external components to open this modal
  React.useEffect(() => {
    const handleOpenTagModal = () => setIsOpen(true);
    window.addEventListener('openTagModal', handleOpenTagModal);
    return () => window.removeEventListener('openTagModal', handleOpenTagModal);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">New Tag</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-colors ${
                    color === colorOption
                      ? 'border-gray-900 ring-2 ring-gray-300'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
            
            {/* Preview */}
            <div className="mt-2">
              <div
                className="inline-block px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {name || 'Preview'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagFormModal;