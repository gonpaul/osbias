'use client';

import { useMemo, useState, useEffect } from 'react';
import MarkdownContent from '@/components/common/MarkdownContent';
import ApiDestinationConfigModal, { ApiDestinationConfig } from './ApiDestinationConfigModal';

type Visibility = 'public' | 'unlisted' | 'private';
type DestinationType = 'platform' | 'api' | 'twitter' | 'telegram';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (slug: string) => void;
  entryId: number | null;
  initialTitle: string;
  content: string;
};

const STORAGE_KEY = 'api_destinations';

function loadApiDestinations(): ApiDestinationConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveApiDestination(config: ApiDestinationConfig) {
  const destinations = loadApiDestinations();
  const existingIndex = destinations.findIndex(d => d.id === config.id);
  if (existingIndex >= 0) {
    destinations[existingIndex] = config;
  } else {
    destinations.push(config);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
}

function deleteApiDestination(id: string) {
  const destinations = loadApiDestinations();
  const filtered = destinations.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export default function PublishModal({ isOpen, onClose, onPublished, entryId, initialTitle, content }: Props) {
  const [title, setTitle] = useState(initialTitle || '');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'details' | 'preview'>('details');
  const [destination, setDestination] = useState<DestinationType>('platform');
  const [apiDestinations, setApiDestinations] = useState<ApiDestinationConfig[]>([]);
  const [selectedApiDestination, setSelectedApiDestination] = useState<string>('');
  const [showApiConfigModal, setShowApiConfigModal] = useState(false);
  const [editingApiConfig, setEditingApiConfig] = useState<ApiDestinationConfig | null>(null);
  const [apiExtraFields, setApiExtraFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setApiDestinations(loadApiDestinations());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTitle(initialTitle || '');
  }, [isOpen, initialTitle]);

  // When a destination is selected, inspect its JSON mapping and collect
  // top-level keys with empty string values so the user can fill them in
  useEffect(() => {
    if (!selectedApiDestination) {
      setApiExtraFields({});
      return;
    }
    const cfg = apiDestinations.find(d => d.id === selectedApiDestination);
    if (!cfg || !cfg.contentType) {
      setApiExtraFields({});
      return;
    }
    try {
      const obj = JSON.parse(cfg.contentType);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const emptyKeys: Record<string, string> = {};
        for (const k of Object.keys(obj)) {
          if (obj[k] === '') emptyKeys[k] = '';
        }
        setApiExtraFields(emptyKeys);
      } else {
        setApiExtraFields({});
      }
    } catch {
      // Ignore mapping parse errors here; they'll surface on submit
      setApiExtraFields({});
    }
  }, [selectedApiDestination, apiDestinations]);

  const excerpt = useMemo(() => {
    const text = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
      .replace(/^>\s?/gm, '')
      .replace(/^#+\s+/gm, '')
      .replace(/[*_~`>#-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const maxLen = 240;
    if (text.length <= maxLen) return text;
    const slice = text.slice(0, maxLen - 1);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 32 ? slice.slice(0, lastSpace) : slice).trim() + '…';
  }, [content]);

  const handleApiConfigSave = (config: ApiDestinationConfig) => {
    saveApiDestination(config);
    setApiDestinations(loadApiDestinations());
    if (!selectedApiDestination || selectedApiDestination === editingApiConfig?.id) {
      setSelectedApiDestination(config.id);
    }
    setEditingApiConfig(null);
    setShowApiConfigModal(false);
  };

  const handleNewApiConfig = () => {
    setEditingApiConfig(null);
    setShowApiConfigModal(true);
  };

  const handleEditApiConfig = (id: string) => {
    const config = apiDestinations.find(d => d.id === id);
    if (config) {
      setEditingApiConfig(config);
      setShowApiConfigModal(true);
    }
  };

  const handleDeleteApiConfig = (id: string) => {
    if (confirm('Are you sure you want to delete this API destination?')) {
      deleteApiDestination(id);
      setApiDestinations(loadApiDestinations());
      if (selectedApiDestination === id) {
        setSelectedApiDestination('');
      }
    }
  };

  const replacePlaceholders = (template: string, data: { title: string; content: string; excerpt: string }): string => {
    // Escape JSON special characters in the data
    const escapeJson = (str: string): string => {
      return str
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t');  // Escape tabs
    };

    return template
      .replace(/\{\{title\}\}/g, escapeJson(data.title))
      .replace(/\{\{content\}\}/g, escapeJson(data.content))
      .replace(/\{\{excerpt\}\}/g, escapeJson(data.excerpt));
  };

  const canSubmit = 
    destination === 'platform' 
      ? !!entryId && !!title && !submitting
      : destination === 'api' 
        ? !!selectedApiDestination && !submitting
        : false; // Twitter and Telegram not implemented yet

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    
    try {
      if (destination === 'platform') {
        // Original platform publish
        if (!entryId || !title) return;
        const res = await fetch('/api/posts/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ entry_id: entryId, title, visibility }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed: ${res.status}`);
        }
        const post = await res.json();
        onPublished?.(post.slug);
        onClose();
      } else if (destination === 'api') {
        // API POST request
        const apiConfig = apiDestinations.find(d => d.id === selectedApiDestination);
        if (!apiConfig) {
          throw new Error('API destination not found');
        }

        // Build headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add authentication headers
        if (apiConfig.authType === 'bearer' && apiConfig.bearerToken) {
          headers['Authorization'] = `Bearer ${apiConfig.bearerToken}`;
        } else if (apiConfig.authType === 'basic' && apiConfig.basicUsername && apiConfig.basicPassword) {
          const credentials = btoa(`${apiConfig.basicUsername}:${apiConfig.basicPassword}`);
          headers['Authorization'] = `Basic ${credentials}`;
        } else if (apiConfig.authType === 'custom' && apiConfig.customHeaders) {
          try {
            const customHeaders = JSON.parse(apiConfig.customHeaders);
            Object.assign(headers, customHeaders);
          } catch {
            throw new Error('Invalid custom headers format');
          }
        }

        // Build request body
        const effectiveTitle =
          (title && title.trim()) ||
          (initialTitle && initialTitle.trim()) ||
          'Untitled';

        const dataMap = replacePlaceholders(apiConfig.contentType || '{}', {
          title: effectiveTitle,
          content,
          excerpt,
        });
        let requestBody: Record<string, unknown>;
        try {
          requestBody = JSON.parse(dataMap);
        } catch (e) {
          throw new Error(`Invalid content data mapping: ${e instanceof Error ? e.message : 'Unknown error'}. JSON: ${dataMap}`);
        }

        // Merge user-provided extra fields (keys that were empty strings in mapping)
        if (apiExtraFields && Object.keys(apiExtraFields).length > 0) {
          for (const [k, v] of Object.entries(apiExtraFields)) {
            requestBody[k] = v;
          }
        }

        // Make API request
        const res = await fetch(apiConfig.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          throw new Error(`API request failed: ${res.status} ${errorText.substring(0, 100)}`);
        }

        await res.json().catch(() => ({}));
        alert(`Successfully published to ${apiConfig.name || apiConfig.url}`);
        onClose();
      } else if (destination === 'twitter' || destination === 'telegram') {
        setError(`${destination === 'twitter' ? 'Twitter' : 'Telegram'} destination is not yet implemented`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-(--darkelbg) w-full max-w-2xl p-6 rounded shadow-xl border-1 border-(--secondary)">
        <h2 className="text-xl font-semibold mb-4">Publish</h2>
        <div className="mb-4 flex items-center gap-3 border-b-1 border-(--secondary)/40 pb-2">
          <button
            className={`px-3 py-1 cursor-pointer rounded ${mode === 'details' ? 'bg-(--emphasis) text-white' : 'border-1 border-(--secondary)'}`}
            onClick={() => setMode('details')}
            disabled={submitting}
          >
            Details
          </button>
          <button
            className={`px-3 py-1 cursor-pointer rounded ${mode === 'preview' ? 'bg-(--emphasis) text-white' : 'border-1 border-(--secondary)'}`}
            onClick={() => setMode('preview')}
            disabled={submitting}
          >
            Preview
          </button>
        </div>

        {mode === 'details' && (
        <div className="mb-4">
        <div className="mb-3">
          <label className="block text-sm mb-1">Publish Destination</label>
          <select
            className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
            value={destination}
            onChange={e => setDestination(e.target.value as DestinationType)}
            disabled={submitting}
          >
            <option value="platform">Platform</option>
            <option value="api">API POST Request</option>
            <option value="twitter">Twitter (Coming Soon)</option>
            <option value="telegram">Telegram (Coming Soon)</option>
          </select>
        </div>

        {destination === 'platform' && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">Title</label>
              <input
                className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={240}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Visibility</label>
              <select
                className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                value={visibility}
                onChange={e => setVisibility(e.target.value as Visibility)}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </>
        )}

        {destination === 'api' && (
          <div className="mb-3">
            <label className="block text-sm mb-1">API Destination</label>
            <div className="flex gap-2 mb-2">
              <select
                className="flex-1 px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                value={selectedApiDestination}
                onChange={e => setSelectedApiDestination(e.target.value)}
                disabled={submitting}
              >
                <option value="">Select or create API destination</option>
                {apiDestinations.map(dest => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-2 rounded bg-transparent border-1 border-(--secondary) cursor-pointer"
                onClick={handleNewApiConfig}
                disabled={submitting}
              >
                + New
              </button>
            </div>
            {selectedApiDestination && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-sm rounded bg-transparent border-1 border-(--secondary) cursor-pointer"
                  onClick={() => handleEditApiConfig(selectedApiDestination)}
                  disabled={submitting}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-sm rounded bg-transparent border-1 border-red-500/50 text-red-400 cursor-pointer"
                  onClick={() => handleDeleteApiConfig(selectedApiDestination)}
                  disabled={submitting}
                >
                  Delete
                </button>
                </div>
                {Object.keys(apiExtraFields).length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(apiExtraFields).map(key => (
                      <div key={key}>
                        <label className="block text-sm mb-1">{key}</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                          value={apiExtraFields[key]}
                          onChange={e => setApiExtraFields(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={key}
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(destination === 'twitter' || destination === 'telegram') && (
          <div className="mb-3 p-3 bg-(--emphasis)/10 border border-(--emphasis)/30 rounded">
            <p className="text-sm text-(--muted)">
              {destination === 'twitter' ? 'Twitter' : 'Telegram'} integration is coming soon.
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm mb-1">Excerpt</label>
          <p className="text-(--muted)">{excerpt}</p>
        </div>
        </div>
        )}

        {mode === 'preview' && (
          <div className="mb-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-(--foreground)">{title || '(Untitled)'}</h3>
              <p className="text-xs text-(--secondary)">Visibility: {visibility}</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              <MarkdownContent content={content} />
            </div>
          </div>
        )}
        {error && <p className="text-red-400 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 cursor-pointer rounded bg-transparent border-1 border-(--secondary)"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 cursor-pointer rounded bg-(--emphasis) text-white disabled:opacity-60"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {showApiConfigModal && (
        <ApiDestinationConfigModal
          isOpen={showApiConfigModal}
          onClose={() => {
            setShowApiConfigModal(false);
            setEditingApiConfig(null);
          }}
          onSave={handleApiConfigSave}
          editingConfig={editingApiConfig}
        />
      )}
    </div>
  );
}


