'use client';

import React, { useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface MentalModel {
  id: string;
  title: string;
  description: string;
  textBlock: string;
  filePath: string;
  timestamp: Date;
  frameworks: string[];
}

interface ModelsSuggestionProps {
  className?: string;
}

const ModelsSuggestion: React.FC<ModelsSuggestionProps> = ({ className = '' }) => {
  const [showAll, setShowAll] = useState(false);

  // Mock data for mental models
  const mockModels: MentalModel[] = [
    {
      id: '1',
      title: 'Systems Thinking',
      description: 'Understanding how different parts of a system interact and influence each other',
      textBlock: 'The authentication flow should be designed as a complete system, considering how user input, validation, database queries, and error handling all work together.',
      filePath: '/src/components/Auth.tsx',
      timestamp: new Date('2024-01-15T10:30:00'),
      frameworks: ['Causal Loop Diagrams', 'Stock and Flow', 'Leverage Points']
    },
    {
      id: '2',
      title: 'First Principles Thinking',
      description: 'Breaking down complex problems into fundamental truths and building up from there',
      textBlock: 'Instead of copying existing patterns, let\'s think about what we actually need: data validation, user feedback, and error recovery.',
      filePath: '/src/hooks/useData.ts',
      timestamp: new Date('2024-01-15T09:15:00'),
      frameworks: ['Socratic Questioning', '5 Whys', 'Assumption Mapping']
    },
    {
      id: '3',
      title: 'Defensive Programming',
      description: 'Writing code that anticipates and handles potential failures gracefully',
      textBlock: 'We need to validate all user inputs and sanitize data before processing to prevent security vulnerabilities.',
      filePath: '/src/utils/validation.ts',
      timestamp: new Date('2024-01-14T16:45:00'),
      frameworks: ['Input Validation', 'Error Handling', 'Fail-Safe Defaults']
    },
    {
      id: '4',
      title: 'Progressive Enhancement',
      description: 'Building functionality that works for everyone, then adding enhancements for capable users',
      textBlock: 'Start with basic functionality that works without JavaScript, then add interactive features for better user experience.',
      filePath: '/src/components/DataTable.tsx',
      timestamp: new Date('2024-01-14T14:20:00'),
      frameworks: ['Graceful Degradation', 'Feature Detection', 'Layered Architecture']
    },
    {
      id: '5',
      title: 'Type Safety',
      description: 'Using strong typing to catch errors at compile time rather than runtime',
      textBlock: 'Define clear interfaces and use TypeScript strict mode to ensure data integrity throughout the application.',
      filePath: '/src/types/index.ts',
      timestamp: new Date('2024-01-13T11:10:00'),
      frameworks: ['Static Analysis', 'Compile-time Checks', 'Interface Segregation']
    }
  ];

  const displayedModels = showAll ? mockModels : mockModels.slice(0, 3);

  const handleModelClick = (modelName: string) => {
    // Navigate to the mental models page
    console.log(`Navigate to /mental-models/${modelName.toLowerCase().replace(/\s+/g, '-')}`);
    // In a real app, you would use router.push here
    // router.push(`/mental-models/${modelName.toLowerCase().replace(/\s+/g, '-')}`);
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
        <h2 className="text-lg text-center font-semibold text-(--foreground)">Models</h2>
        <p className="text-sm text-center text-(--secondary) mt-1">Mental Models & Patterns</p>
      </div>

      {/* Models List */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayedModels.length > 0 ? (
          <div className="space-y-3">
            {displayedModels.map((model) => (
              <div
                key={model.id}
                className="p-4 bg-(--darkelbg) rounded-lg border border-(--secondary)/60 hover:border-(--emphasis) transition-colors cursor-pointer"
                onClick={() => handleModelClick(model.title)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-(--foreground) flex-1">
                    {model.title}
                  </h3>
                  <FaExternalLinkAlt className="w-5 h-5 text-(--secondary) flex-shrink-0 ml-2" />
                </div>
                
                <p className="text-xs text-(--gray-500) mb-3 line-clamp-2">
                  {model.description}
                </p>
                
                <div className="text-xs text-(--emphasis-light) font-medium mb-2 p-2 bg-(--background) rounded border-l-2 border-blue-400">
                  {model.textBlock}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {model.frameworks.slice(0, 2).map((framework, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-(--emphasis)/20 text-blue-400/80 rounded-full"
                    >
                      {framework}
                    </span>
                  ))}
                  {model.frameworks.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-(--secondary)/20 text-(--gray-500)/80 rounded-full">
                      +{model.frameworks.length - 2} more
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-(--gray-500)/80">
                  <span>{formatTimestamp(model.timestamp)}</span>
                  <span className="truncate max-w-[120px]">{model.filePath.split('/').pop()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-(--secondary) py-8">
            No models suggested yet
          </div>
        )}

        {/* Show More Button */}
        {mockModels.length > 3 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="cursor-pointer px-4 py-2 text-sm bg-(--emphasis) text-white rounded-md hover:opacity-80 transition-opacity"
            >
              {showAll ? 'Show Less' : `Show More (+${mockModels.length - 3})`}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-(--secondary)/60">
        <div className="text-sm text-(--foreground)/80 text-center">
          Total Models: <span className="font-semibold text-(--foreground)/80">{mockModels.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ModelsSuggestion;
