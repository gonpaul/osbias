'use client';

import React, { useState, useEffect } from 'react';

interface ValidationHistoryEntry {
  id: number;
  user_id: number;
  journal_entry_id: number | null;
  original_text: string;
  validation_result: string;
  ai_provider: string | null;
  ai_model: string | null;
  text_start: number | null;
  text_end: number | null;
  is_full_document: boolean;
  created_at: string;
  updated_at: string;
}

interface ValidationStep {
  id: string;
  proposition: string;
  isValid: boolean;
  confidence: number;
  reasoning: string;
  dependencies: string[];
  environment: string;
}

interface ValidationResult {
  overallValid: boolean;
  steps: ValidationStep[];
  summary: string;
  recommendations: string[];
}

// Helper function to parse validation result from JSON string
const parseValidationResult = (jsonString: string): ValidationResult => {
  try {
    return JSON.parse(jsonString) as ValidationResult;
  } catch (error) {
    console.error('Failed to parse validation result:', error);
    return {
      overallValid: false,
      steps: [],
      summary: 'Failed to parse validation result',
      recommendations: []
    };
  }
};

type ValidationHistoryProps = { className?: string; filePath?: string; entryId?: number };

const ValidationHistory: React.FC<ValidationHistoryProps> = ({ className = '', filePath, entryId }) => {
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  const fetchValidationHistory = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (entryId) qs.set('entry_id', String(entryId));
      // else if (filePath) qs.set('file_path', filePath);
      // If we have an entry_id available from context in future, prefer it for precision
      const response = await fetch(`/api/validation-history${qs.toString() ? `?${qs.toString()}` : ''}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch validation history');
      }
      
      let data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        // Try file_path if entry_id returned nothing
        if (entryId && filePath) {
          const alt = await fetch(`/api/validation-history?file_path=${encodeURIComponent(filePath)}`, { credentials: 'include' });
          if (alt.ok) data = await alt.json();
        }
        // Last resort: show all user history
        if (Array.isArray(data) && data.length === 0 && (entryId || filePath)) {
          const all = await fetch(`/api/validation-history`, { credentials: 'include' });
          if (all.ok) data = await all.json();
        }
      }
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch validation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationHistory();
  }, [filePath, entryId]);


  const handleSearch = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (searchTerm) qs.set('search', searchTerm);
      if (entryId) qs.set('entry_id', String(entryId));
      else if (filePath) qs.set('file_path', filePath);
      const url = `/api/validation-history${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to search validation history');
      }
      
      let data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        if (entryId && filePath) {
          const alt = await fetch(`/api/validation-history?search=${encodeURIComponent(searchTerm)}&file_path=${encodeURIComponent(filePath)}`, { credentials: 'include' });
          if (alt.ok) data = await alt.json();
        }
        if (Array.isArray(data) && data.length === 0 && (entryId || filePath)) {
          const all = await fetch(`/api/validation-history?search=${encodeURIComponent(searchTerm)}`, { credentials: 'include' });
          if (all.ok) data = await all.json();
        }
      }
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search validation history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const deleteEntry = async (id: number) => {
    try {
      const response = await fetch(`/api/validation-history/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete validation history entry');
      }
      
      setHistory(history.filter(entry => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className={`w-full h-full bg-(--background)/50 p-3 rounded-xl flex flex-col overflow-hidden ${className}`}>
        <div className="p-4 border-b border-(--secondary)/60">
          <h2 className="text-lg font-semibold text-(--foreground) mb-3">Validation History</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-(--secondary)">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-full bg-(--background)/50 p-3 rounded-xl flex flex-col overflow-hidden ${className}`}>
        <div className="p-4 border-b border-(--secondary)/60">
          <h2 className="text-lg font-semibold text-(--foreground) mb-3">Validation History</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-center">
            <div className="mb-2">Error loading history</div>
            <div className="text-sm text-(--secondary)">{error}</div>
            <button 
              onClick={fetchValidationHistory}
              className="mt-2 px-3 py-1 bg-(--emphasis) text-white rounded text-sm hover:opacity-80"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-(--background)/50 p-3 rounded-xl flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-(--secondary)/60">
        <h2 className="text-lg font-semibold text-(--foreground) mb-3">Validation History</h2>
        
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search validations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-2 py-1 text-sm bg-(--darkelbg) text-(--foreground) rounded border border-(--secondary)/40 focus:outline-none focus:border-(--emphasis)"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1 bg-(--emphasis) text-white rounded text-sm hover:opacity-80"
          >
            Search
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-(--secondary) text-center py-8">
            No validation history found
          </div>
        ) : (
          history.map((entry) => {
            const validationResult = parseValidationResult(entry.validation_result);
            const isExpanded = expandedEntries.has(entry.id);
            
            return (
              <div key={entry.id} className="border border-(--secondary)/40 rounded-lg p-4 bg-(--darkelbg) w-full">
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-(--foreground) mb-1">
                      {formatDate(entry.created_at)}
                    </div>
                    <div className="text-xs text-(--secondary) mb-2">
                      {entry.is_full_document ? 'Full Document' : 'Selected Text'} • 
                      {entry.ai_provider} • {entry.ai_model}
                    </div>
                    <div className="text-sm text-(--foreground) mb-2">
                      {truncateText(entry.original_text)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        validationResult.overallValid 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {validationResult.overallValid ? 'VALID' : 'INVALID'}
                      </span>
                      <span className="text-xs text-(--secondary)">
                        {validationResult.steps.length} steps
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="px-2 py-1 text-xs bg-(--secondary)/20 text-(--foreground) rounded hover:bg-(--secondary)/40"
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="px-2 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    {/* Original Text */}
                    <div>
                      <div className="text-xs text-(--secondary) mb-1">Original Text:</div>
                      <div className="text-sm text-(--foreground) bg-(--background) p-2 rounded border border-(--secondary)">
                        {entry.original_text}
                      </div>
                    </div>

                    {/* Validation Steps */}
                    <div>
                      <div className="text-xs text-(--secondary) mb-2">Validation Steps:</div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {validationResult.steps.map((step, index) => (
                          <div key={step.id} className="border border-(--secondary)/40 rounded p-3 bg-(--background) w-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-(--foreground)">
                                Step {index + 1}: {step.proposition}
                              </span>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                step.isValid 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-red-900 text-red-300'
                              }`}>
                                {step.isValid ? 'VALID' : 'INVALID'}
                              </span>
                            </div>
                            <div className="text-xs text-(--secondary) mb-1">
                              Environment: {step.environment} • Confidence: {Math.round(step.confidence * 100)}%
                            </div>
                            <div className="text-sm text-(--foreground) bg-(--darkelbg) p-2 rounded">
                              {step.reasoning}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    {validationResult.summary && (
                      <div>
                        <div className="text-xs text-(--secondary) mb-1">Summary:</div>
                        <div className="text-sm text-(--foreground) bg-(--background) p-2 rounded border border-(--secondary)">
                          {validationResult.summary}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {validationResult.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs text-(--secondary) mb-1">Recommendations:</div>
                        <ul className="text-sm text-(--foreground) bg-(--background) p-2 rounded border border-(--secondary)">
                          {validationResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-(--secondary)">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ValidationHistory;
