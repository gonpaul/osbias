'use client';

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import type { RootState } from '@/lib/redux/store';
import {
  setHeaders,
  setLoading,
  setError,
  removeHeader,
  addHeader,
} from '@/lib/redux/slices/journalHeadersSlice';
import type { JournalEntryHeader } from '@/models/journal';
import { setCurrent } from '@/lib/redux/slices/currentJournalSlice';

type ID = number;

interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
  path: string;
  entryId?: number;
}

interface FileSystemProps {
  width?: string;
  className?: string;
}

function headersToFileSystem(headers: JournalEntryHeader[], t: (key: string) => string): FileSystemItem[] {
  return [
    {
      id: 'journal-root',
      name: t('journalRoot'),
      type: 'folder',
      path: '/journal',
      children: headers.map(h => ({
        id: `entry-${h.id}`,
        name: h.title || `Entry ${h.id}`,
        type: 'file' as const,
        path: `/journal/${h.id}`,
        entryId: h.id,
      })),
    },
  ];
}

const FileSystem: React.FC<FileSystemProps> = memo(({
  width = 'w-80',
  className = ''
}) => {
  const t = useTranslations('Editor');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['journal-root']));
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Use lightweight headers from Redux store (not full entries)
  const headers = useSelector((state: RootState) => state.journalHeaders.headers);
  const loading = useSelector((state: RootState) => state.journalHeaders.loading);
  const current = useSelector((state: RootState) => state.currentJournal.current);

  // Load only headers (no content) on mount
  useEffect(() => {
    let active = true;
    (async () => {
      dispatch(setLoading(true));
      try {
        const res = await fetch('/api/journal/headers', { credentials: 'include' });
        if (!active) return;
        if (res.ok) {
          const data = await res.json() as JournalEntryHeader[];
          dispatch(setHeaders(data));
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

  const fileSystemData: FileSystemItem[] = useMemo(
    () => headersToFileSystem(headers, t),
    [headers, t]
  );

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const handleSearch = useCallback(() => {
    // Optionally implement search trigger
  }, []);

  // Load single entry on demand (lazy)
  const fetchEntry = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/journal/${id}`, { credentials: 'include' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Optionally handle error
    }
    return null;
  }, []);

  // Handler for clicking a file entry — lazy load content
  const handleFileClick = useCallback(
    async (item: FileSystemItem) => {
      if (item.type !== 'file' || item.entryId == null) return;
      if (!current || current.id !== item.entryId) {
        const entry = await fetchEntry(item.entryId);
        if (entry) {
          dispatch(setCurrent(entry));
        }
      }
    },
    [current, dispatch, fetchEntry]
  );

  // Create a new draft entry (not yet saved to backend)
  const createNew = useCallback(() => {
    const now = new Date().toISOString();
    const draftId = -Date.now(); // negative temp ID
    dispatch(setCurrent(null));
    // Signal the UI that a blank draft has been opened
    try {
      window.dispatchEvent(new CustomEvent('blank-entry-opened'));
    } catch {}
    // Add placeholder header to sidebar
    dispatch(addHeader({
      id: draftId,
      title: t('untitled'),
      created_at: now,
      updated_at: now,
    }));
  }, [dispatch, t]);

  const deleteEntry = useCallback(async (id: ID) => {
    if (id < 0) {
      dispatch(setCurrent(null));
      dispatch(removeHeader(id));
      return;
    }
    const res = await fetch(`/api/journal/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.status === 204) {
      dispatch(removeHeader(id));
      if (current && current.id === id) {
        dispatch(setCurrent(null));
      }
    }
  }, [dispatch, current]);

  const renderFileSystemItem = useCallback((item: FileSystemItem, depth: number = 0): React.ReactNode => {
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
            flex items-center py-1 px-2 cursor-pointer hover:bg-(--natural-gray) hover:bg-(--darkelbg) w-full min-w-0 group
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
              title={t('deleteTitle')}
              role="button"
              tabIndex={-1}
              style={{
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
  }, [expandedFolders, current, hoveredFileId, toggleFolder, handleFileClick, deleteEntry, t]);

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
    <div className={`${width} overflow-hidden ml-30 mt-10 h-full bg-(--background) border-none flex flex-col ${className}`}>
      {/* Search Bar */}
      <div className="w-full p-4 border-none">
        <div className="flex gap-1 w-full rounded-lg">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm border-none rounded-xs dark:bg-(--darkelbg) text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="flex-shrink-0 cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-xs transition-colors duration-200 focus:outline-none focus:ring-offset-2"
          >
            {t('searchButton')}
          </button>
        </div>
      </div>

      {/* New Button Only */}
      <div className="flex items-center gap-2 px-4 py-2 border-none">
        <button
          className="cursor-pointer px-3 py-1 rounded bg-(--emphasis) text-white text-sm hover:opacity-80"
          onClick={createNew}
        >
          {t('newButton')}
        </button>
      </div>

      {/* File System Tree */}
      <div className="flex-1 overflow-y-auto p-2 w-full ">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('loading')}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-1 w-full">
            {filteredData.map(item => renderFileSystemItem(item))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchTerm ? t('noFilesFound') : t('noFilesAvailable')}
          </div>
        )}
      </div>
    </div>
  );
});

FileSystem.displayName = 'FileSystem';

export default FileSystem;
