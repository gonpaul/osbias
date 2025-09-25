'use client';

import React, { useState, useMemo } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';

interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
  path: string;
}

interface FileSystemProps {
  width?: string;
  className?: string;
}

const FileSystem: React.FC<FileSystemProps> = ({ 
  width = 'w-80', 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Mock file system data - replace with your actual data source
  const fileSystemData: FileSystemItem[] = [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              type: 'file',
              path: '/src/components/Button.tsx'
            },
            {
              id: '4',
              name: 'Modal.tsx',
              type: 'file',
              path: '/src/components/Modal.tsx'
            }
          ]
        },
        {
          id: '5',
          name: 'utils',
          type: 'folder',
          path: '/src/utils',
          children: [
            {
              id: '6',
              name: 'helpers.ts',
              type: 'file',
              path: '/src/utils/helpers.ts'
            }
          ]
        },
        {
          id: '7',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx'
        }
      ]
    },
    {
      id: '8',
      name: 'public',
      type: 'folder',
      path: '/public',
      children: [
        {
          id: '9',
          name: 'images',
          type: 'folder',
          path: '/public/images',
          children: [
            {
              id: '10',
              name: 'logo.png',
              type: 'file',
              path: '/public/images/logo.png'
            }
          ]
        }
      ]
    },
    {
      id: '11',
      name: 'package.json',
      type: 'file',
      path: '/package.json'
    }
  ];

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
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  const renderFileSystemItem = (item: FileSystemItem, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(item.id);
    const isFolder = item.type === 'folder';
    const hasChildren = isFolder && item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-(--darkelbg) w-full min-w-0
            ${depth > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => isFolder && toggleFolder(item.id)}
        >
          {isFolder && (
            <span className="mr-2 text-(--secondary) flex-shrink-0">
              {isExpanded ? <FaFolderOpen/> : <FaFolder/>}
            </span>
          )}
          {!isFolder && (
            <span className="mr-2 text-gray-400 flex-shrink-0">📄</span>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0 flex-1">
            {item.name}
          </span>
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

      {/* File System Tree */}
      <div className="flex-1 overflow-y-auto p-2 w-full">
        {filteredData.length > 0 ? (
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
