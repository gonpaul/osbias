'use client';

import React, { useState } from 'react';

interface Idea {
  id: string;
  content: string;
  textSelection: string;
  filePath: string;
  timestamp: Date;
}

interface WatchDogProps {
  className?: string;
}

const WatchDog: React.FC<WatchDogProps> = ({ className = '' }) => {
  const [showAll, setShowAll] = useState(false);

  // Mock data
  const mockIdeas: Idea[] = [
    {
      id: '1',
      content: 'Consider adding error handling for edge cases in the authentication flow',
      textSelection: 'authentication flow validation',
      filePath: '/src/components/Auth.tsx',
      timestamp: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      content: 'This function could be optimized with memoization to prevent unnecessary re-renders',
      textSelection: 'useEffect dependency array',
      filePath: '/src/hooks/useData.ts',
      timestamp: new Date('2024-01-15T09:15:00')
    },
    {
      id: '3',
      content: 'Add input validation to prevent XSS attacks on user-generated content',
      textSelection: 'user input sanitization',
      filePath: '/src/utils/validation.ts',
      timestamp: new Date('2024-01-14T16:45:00')
    },
    {
      id: '4',
      content: 'Consider implementing a loading state for better UX during API calls',
      textSelection: 'async data fetching',
      filePath: '/src/components/DataTable.tsx',
      timestamp: new Date('2024-01-14T14:20:00')
    },
    {
      id: '5',
      content: 'This could benefit from TypeScript strict mode for better type safety',
      textSelection: 'interface definition',
      filePath: '/src/types/index.ts',
      timestamp: new Date('2024-01-13T11:10:00')
    }
  ];

  const displayedIdeas = showAll ? mockIdeas : mockIdeas.slice(0, 3);

  const handleFileClick = (filePath: string) => {
    // Simple link logic - in a real app, this would navigate to the file
    console.log(`Navigate to file: ${filePath}`);
    // You could implement actual navigation here
    // router.push(`/editor?file=${encodeURIComponent(filePath)}`);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`w-[300px] h-full bg-(--background) mx-4 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg text-center font-semibold text-(--foreground)">WatchDog</h2>
        <p className="text-sm text-center text-(--secondary) mt-1">Ideas & Thoughts</p>
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayedIdeas.length > 0 ? (
          <div className="space-y-3">
            {displayedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-6 bg-(--darkelbg) rounded-lg border border-(--secondary)/60 hover:border-(--emphasis) transition-colors cursor-pointer"
                onClick={() => handleFileClick(idea.filePath)}
              >
                <div className="text-xs text-(--emphasis-light) font-medium mb-2">
                  {idea.textSelection}
                </div>
                <div className="text-sm text-(--foreground)/80 mb-2 line-clamp-3">
                  {idea.content}
                </div>
                <div className="flex justify-between items-center text-xs text-(--secondary)">
                  <span>{formatTimestamp(idea.timestamp)}</span>
                  <span className="truncate max-w-[120px]">{idea.filePath.split('/').pop()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-(--secondary) py-8">
            No ideas yet
          </div>
        )}

        {/* Show More Button */}
        {mockIdeas.length > 3 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="cursor-pointer px-4 py-2 text-sm bg-(--emphasis) text-white rounded-md hover:opacity-80 transition-opacity"
            >
              {showAll ? 'Show Less' : `Show More (+${mockIdeas.length - 3})`}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-(--secondary)/60">
        <div className="text-sm text-(--foreground)/80 text-center">
          Total Ideas: <span className="font-semibold text-(--foreground)/80">{mockIdeas.length}</span>
        </div>
      </div>
    </div>
  );
};

export default WatchDog;
