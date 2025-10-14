'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { setEntries, setLoading, setError } from '@/lib/redux/slices/journalEntriesSlice';
import type { JournalEntry } from '@/lib/redux/slices/journalEntriesSlice';
import { setCurrent } from '@/lib/redux/slices/currentJournalSlice';

// JournalEntry type from JournalEditor
type ID = number;

interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
  path: string;
  entryId?: number; // For linking to JournalEntry
}

interface FileSystemProps {
  width?: string;
  className?: string;
}

function entriesToFileSystem(entries: JournalEntry[]): FileSystemItem[] {
  // Flat list of entries as files under a "Journal" folder
  return [
    {
      id: 'journal-root',
      name: 'Journal',
      type: 'folder',
      path: '/journal',
      children: entries.map(entry => ({
        id: `entry-${entry.id}`,
        name: entry.title || `Entry ${entry.id}`,
        type: 'file',
        path: `/journal/${entry.id}`,
        entryId: entry.id,
      })),
    },
  ];
}

const FileSystem: React.FC<FileSystemProps> = ({
  width = 'w-80',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['journal-root']));
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Use entries from Redux store
  const entries = useSelector((state: RootState) => state.journalEntries.entries);
  const loading = useSelector((state: RootState) => state.journalEntries.loading);
  const current = useSelector((state: RootState) => state.currentJournal.current);

  useEffect(() => {
    let active = true;
    (async () => {
      dispatch(setLoading(true));
      try {
        const res = await fetch('/api/journal', { credentials: 'include' });
        if (!active) return;
        if (res.ok) {
          const data = await res.json() as JournalEntry[];
          dispatch(setEntries(data));
        } else {
          dispatch(setError('Failed to load journal entries'));
        }
      } catch (e) {
        if (active) dispatch(setError('Failed to load journal entries'));
      } finally {
        if (active) dispatch(setLoading(false));
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const fileSystemData: FileSystemItem[] = useMemo(() => entriesToFileSystem(entries), [entries]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleSearch = () => {
    // Optionally implement search trigger
  };

  // Memoize entry lookup for fast access
  // const entryById = useMemo(() => {
  //   const map = new Map<number, JournalEntry>();
  //   for (const entry of entries) {
  //     map.set(entry.id, entry);
  //   }
  //   return map;
  // }, [entries]);
  // Returns a JournalEntry by id from Redux state
  const getEntryById = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/journal/${id}`, { credentials: 'include' });
        if (res.ok) {
          const entry = await res.json();
          return entry;
        }
      } catch (e) {
        // Optionally handle error
      }
      return null;
    },
    [entries]
  );

  // Handler for clicking a file entry
  const handleFileClick = useCallback(
    async (item: FileSystemItem) => {
      if (item.type !== 'file' || item.entryId == null) return;
      // Only dispatch if different from current
      if (!current || current.id !== item.entryId) {
        // const entry = entryById.get(item.entryId);
        const entry = await getEntryById(item.entryId);
        if (entry) {
          dispatch(setCurrent(entry));
        }
      }
    },
    // [current, entryById, dispatch]
    [current, dispatch]
  );

  // --- New and Delete logic ---
  // Create a new draft entry (not yet saved to backend)
  const createNew = useCallback(() => {
    const draft: JournalEntry = {
      id: -1,
      user_id: -1,
      framework_id: null,
      title: 'Untitled',
      content: ''
    };
    dispatch(setCurrent(draft));
    // Signal the UI that a blank draft has been opened so starter overlay can appear
    try {
      window.dispatchEvent(new CustomEvent('blank-entry-opened'));
    } catch {}
  }, [dispatch]);

  // Delete the current entry (if any)
  const deleteEntry = useCallback(async (id: ID) => {
    if (id === -1) {
      dispatch(setCurrent(null));
      return;
    }
    const res = await fetch(`/api/journal/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.status === 204) {
      dispatch(setEntries(entries.filter(x => x.id !== id)));
      if (current && current.id === id) {
        const next = entries.find(x => x.id !== id) || null;
        dispatch(setCurrent(next || null));
      }
    }
  }, [dispatch, entries, current]);

  // --- Render file/folder with delete icon logic ---
  const renderFileSystemItem = (item: FileSystemItem, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(item.id);
    const isFolder = item.type === 'folder';
    const hasChildren = isFolder && item.children && item.children.length > 0;
    const isCurrent = item.type === 'file' && current && current.id === item.entryId;
    const showDelete =
      item.type === 'file' &&
      (isCurrent || hoveredFileId === item.id);

    return (
      <div
        key={item.id}
        className="w-full"
        onMouseEnter={() => {
          if (item.type === 'file') setHoveredFileId(item.id);
        }}
        onMouseLeave={() => {
          if (item.type === 'file') setHoveredFileId(prev => (prev === item.id ? null : prev));
        }}
      >
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-(--darkelbg) w-full min-w-0 group
            ${depth > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else {
              handleFileClick(item);
            }
          }}
        >
          {isFolder && (
            <span className="mr-2 text-(--secondary) flex-shrink-0">
              {isExpanded ? <FaFolderOpen /> : <FaFolder />}
            </span>
          )}
          {!isFolder && (
            <span className="mr-2 text-gray-400 flex-shrink-0">📄</span>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0 flex-1">
            {item.name}
          </span>
          {/* Delete icon for files */}
          {item.type === 'file' && (
            <span
              className={`
                flex items-center mr-4
                ${isCurrent ? '' : 'opacity-0 group-hover:opacity-80'}
                transition-opacity duration-150
              `}
              onClick={e => {
                e.stopPropagation();
                if (item.entryId != null) deleteEntry(item.entryId);
              }}
              title="Delete"
              role="button"
              tabIndex={-1}
              style={{
                // color: isCurrent ? '#dc2626' : '#888',
                color: '#888',
                cursor: 'pointer',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <FaRegTrashAlt />
            </span>
          )}
        </div>
        {isFolder && isExpanded && hasChildren && (
          <div className="w-full">
            {item.children!.map(child => renderFileSystemItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return fileSystemData;

    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.reduce((acc: FileSystemItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (item.type === 'file' && matchesSearch) {
          acc.push(item);
        } else if (item.type === 'folder') {
          const filteredChildren = item.children ? filterItems(item.children) : [];
          if (matchesSearch || filteredChildren.length > 0) {
            acc.push({
              ...item,
              children: filteredChildren
            });
          }
        }

        return acc;
      }, []);
    };

    return filterItems(fileSystemData);
  }, [searchTerm, fileSystemData]);

  return (
    <div className={`${width} overflow-hidden mt-10 h-full bg-(--background) border-none flex flex-col ${className}`}>
      {/* Search Bar */}
      <div className="w-full p-4 border-b border-gray-200 dark:border-none">
        <div className="flex gap-1 w-full rounded-lg">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm border-none rounded-xs dark:bg-(--darkelbg) text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="flex-shrink-0 cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-xs transition-colors duration-200 focus:outline-none focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </div>

      {/* New Button Only */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-none">
        <button
          className="cursor-pointer px-3 py-1 rounded bg-(--emphasis) text-white text-sm hover:opacity-80"
          onClick={createNew}
        >
          New
        </button>
      </div>

      {/* File System Tree */}
      <div className="flex-1 overflow-y-auto p-2 w-full">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Loading...
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-1 w-full">
            {filteredData.map(item => renderFileSystemItem(item))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchTerm ? 'No files found' : 'No files available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileSystem;
