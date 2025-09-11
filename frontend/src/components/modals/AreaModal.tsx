import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Area } from '../../types';
import { X, Circle } from 'lucide-react';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArea?: Area | null;
}

const AreaModal: React.FC<AreaModalProps> = ({ isOpen, onClose, editingArea }) => {
  const { addArea, updateArea } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  useEffect(() => {
    if (isOpen) {
      if (editingArea) {
        setName(editingArea.name);
        setColor(editingArea.color);
      } else {
        setName('');
        setColor('#3b82f6');
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, editingArea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const areaData = {
      name: name.trim(),
      color,
    };

    if (editingArea) {
      await updateArea(editingArea.id, areaData);
    } else {
      await addArea(areaData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingArea ? 'Edit Area' : 'New Area'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal, Health"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <Circle className="w-4 h-4 text-white" fill="white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5" style={{ color }} fill={color} />
                <span className="font-medium">{name || 'Area Name'}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {editingArea ? 'Save Changes' : 'Create Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaModal;