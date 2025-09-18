import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Edit3,
  Eye,
  Save,
  X,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface NotesPanelProps {
  projectId: string;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ projectId }) => {
  const { projects, updateProject } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (project?.notes) {
      setNotes(project.notes);
    } else {
      setNotes('');
    }
  }, [project?.notes]);

  const handleSave = async () => {
    if (!project) {
      setError('Project not found');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateProject(project.id, { notes: notes.trim() || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      setError(error instanceof Error ? error.message : 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(project?.notes || '');
    setIsEditing(false);
    setError(null);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setError(null);
  };

  if (!project) return null;

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-200 ${
      isExpanded ? 'w-96' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-800">Project Notes</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-gray-600" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
            {!isEditing && (
              <button
                onClick={handleStartEditing}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Edit notes"
              >
                <Edit3 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors text-sm"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your project notes here...

You can use **Markdown** formatting:
- *italic* or **bold** text
- Lists with - or 1.
- [Links](https://example.com)
- `code blocks`
- > Blockquotes

And much more!"
              className="flex-1 p-4 resize-none border-none outline-none focus:ring-0 text-sm font-mono bg-gray-50"
              autoFocus
            />
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3 h-3" />
                <span>Editing mode - Markdown supported</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {notes.trim() ? (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Customize link rendering to open in new tab
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children || props.href}
                          </a>
                        ),
                        // Customize code blocks
                        pre: ({ node, ...props }) => (
                          <pre {...props} className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm" />
                        ),
                        code: ({ node, ...props }) => (
                          <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm" />
                        ),
                        // Customize blockquotes
                        blockquote: ({ node, ...props }) => (
                          <blockquote {...props} className="border-l-4 border-gray-300 pl-4 text-gray-600 italic" />
                        ),
                      }}
                    >
                      {notes}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span>Preview mode - Double click to edit</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-2">No notes yet</p>
                  <button
                    onClick={handleStartEditing}
                    className="text-primary-600 hover:text-primary-700 text-sm underline"
                  >
                    Add your first note
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;