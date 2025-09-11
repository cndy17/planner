import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, Project, Tag } from '../../types';
import { Search, X, Hash, Folder, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

type SearchResult = {
  type: 'task' | 'project' | 'tag';
  item: Task | Project | Tag;
  matches: string[];
};

const SearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    tasks,
    projects,
    tags,
    setSelectedProjectId,
    setSelectedView,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchModalOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchModalOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, selectedIndex]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search tasks
    tasks.forEach(task => {
      const matches: string[] = [];
      if (task.title.toLowerCase().includes(searchTerm)) {
        matches.push('title');
      }
      if (task.notes?.toLowerCase().includes(searchTerm)) {
        matches.push('notes');
      }
      if (matches.length > 0) {
        results.push({ type: 'task', item: task, matches });
      }
    });

    // Search projects
    projects.forEach(project => {
      const matches: string[] = [];
      if (project.name.toLowerCase().includes(searchTerm)) {
        matches.push('name');
      }
      if (project.description?.toLowerCase().includes(searchTerm)) {
        matches.push('description');
      }
      if (matches.length > 0) {
        results.push({ type: 'project', item: project, matches });
      }
    });

    // Search tags
    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(searchTerm)) {
        results.push({ type: 'tag', item: tag, matches: ['name'] });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [query, tasks, projects, tags]);

  const handleClose = () => {
    setIsSearchModalOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        // Navigate to task's project or view
        const task = result.item as Task;
        if (task.projectId) {
          setSelectedProjectId(task.projectId);
        } else if (task.dueDate) {
          setSelectedView('today');
        } else {
          setSelectedView('anytime');
        }
        break;
      case 'project':
        setSelectedProjectId((result.item as Project).id);
        break;
      case 'tag':
        // Could implement tag filtering here
        break;
    }
    handleClose();
  };

  if (!isSearchModalOpen) return null;

  const getIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        const task = result.item as Task;
        return task.status === 'completed' ? (
          <CheckCircle2 className="w-4 h-4 text-primary-500" />
        ) : (
          <Circle className="w-4 h-4 text-gray-400" />
        );
      case 'project':
        return <Folder className="w-4 h-4 text-gray-400" />;
      case 'tag':
        const tag = result.item as Tag;
        return <Hash className="w-4 h-4" style={{ color: tag.color }} />;
    }
  };

  const getTitle = (result: SearchResult): string => {
    switch (result.type) {
      case 'task':
        return (result.item as Task).title;
      case 'project':
        return (result.item as Project).name;
      case 'tag':
        return (result.item as Tag).name;
    }
  };

  const getSubtitle = (result: SearchResult): string | null => {
    switch (result.type) {
      case 'task':
        const task = result.item as Task;
        if (task.dueDate) {
          return `Due ${format(new Date(task.dueDate), 'MMM d')}`;
        }
        return null;
      case 'project':
        const project = result.item as Project;
        return project.description || null;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks, projects, and tags..."
            className="flex-1 text-lg outline-none"
          />
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => {
                  const subtitle = getSubtitle(result);
                  return (
                    <button
                      key={`${result.type}-${(result.item as any).id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        index === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {getIcon(result)}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-800">
                          {getTitle(result)}
                        </div>
                        {subtitle && (
                          <div className="text-sm text-gray-500">{subtitle}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 uppercase">
                        {result.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}

        {/* Footer with shortcuts */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">ESC</kbd>
              Close
            </span>
          </div>
          {searchResults.length > 0 && (
            <span>{searchResults.length} results</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;