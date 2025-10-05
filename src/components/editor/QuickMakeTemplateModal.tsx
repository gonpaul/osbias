'use client';

import { useState, useEffect } from 'react';
import { emitUIEvent, onUIEvent } from '@/lib/uiEvents';
import { FaTimes } from 'react-icons/fa';

interface QuickMakeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CurrentEntry {
  id: number | null;
  title: string;
  content: string;
}

export default function QuickMakeTemplateModal({ isOpen, onClose }: QuickMakeTemplateModalProps) {
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Request current entry details
      const off = onUIEvent('current-entry-response', (detail) => {
        setCurrentEntry(detail);
        off();
      });
      emitUIEvent('request-current-entry');
    }
  }, [isOpen]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!currentEntry?.id || currentEntry.id === -1) {
      setError('Cannot make a draft entry into a template. Please save the entry first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/journal/${currentEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_template: true,
          tags: JSON.stringify(tags)
        })
      });

      if (response.ok) {
        onClose();
        setTags([]);
        setNewTag('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save template');
      }
    } catch {
      setError('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50">
      <div className="bg-(--background) border border-(--secondary)/30 rounded-xl mt-20 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Make a template</h3>
          <button
            onClick={onClose}
            className="text-(--secondary) hover:text-(--foreground) transition-colors duration-300 cursor-pointer"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-(--emphasis)/20 text-(--emphasis) rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-(--emphasis)/70 transition-colors duration-300 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-(--darkelbg) border border-(--secondary)/30 rounded focus:outline-none focus:border-(--emphasis)/50 transition-colors duration-300"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-(--emphasis) text-white rounded hover:bg-(--emphasis)/80 transition-colors duration-300 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-(--secondary)/30 rounded hover:bg-(--darkelbg) transition-colors duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-(--emphasis) text-white rounded hover:bg-(--emphasis)/80 disabled:opacity-50 transition-colors duration-300 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
