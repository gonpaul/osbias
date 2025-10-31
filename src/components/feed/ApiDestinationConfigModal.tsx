'use client';

import { useState, useEffect } from 'react';

export type ApiDestinationConfig = {
  id: string;
  name: string;
  url: string;
  authType: 'none' | 'bearer' | 'basic' | 'custom';
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  customHeaders?: string; // JSON string
  contentType?: string; // JSON string for content data mapping
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiDestinationConfig) => void;
  editingConfig?: ApiDestinationConfig | null;
};

export default function ApiDestinationConfigModal({
  isOpen,
  onClose,
  onSave,
  editingConfig,
}: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'custom'>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [basicUsername, setBasicUsername] = useState('');
  const [basicPassword, setBasicPassword] = useState('');
  const [customHeaders, setCustomHeaders] = useState('{}');
  const [contentType, setContentType] = useState('{"title": "{{title}}", "content": "{{content}}", "excerpt": "{{excerpt}}"}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);

  useEffect(() => {
    if (editingConfig) {
      setName(editingConfig.name || '');
      setUrl(editingConfig.url || '');
      setAuthType(editingConfig.authType || 'none');
      setBearerToken(editingConfig.bearerToken || '');
      setBasicUsername(editingConfig.basicUsername || '');
      setBasicPassword(editingConfig.basicPassword || '');
      setCustomHeaders(editingConfig.customHeaders || '{}');
      setContentType(editingConfig.contentType || '{"title": "{{title}}", "content": "{{content}}", "excerpt": "{{excerpt}}"}');
    } else {
      // Reset form
      setName('');
      setUrl('');
      setAuthType('none');
      setBearerToken('');
      setBasicUsername('');
      setBasicPassword('');
      setCustomHeaders('{}');
      setContentType('{"title": "{{title}}", "content": "{{content}}", "excerpt": "{{excerpt}}"}');
    }
  }, [editingConfig, isOpen]);

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleContentTypeChange = (value: string) => {
    setContentType(value);
    if (value.trim()) {
      if (validateJson(value)) {
        setJsonError(null);
      } else {
        setJsonError('Invalid JSON format');
      }
    } else {
      setJsonError(null);
    }
  };

  const handleHeadersChange = (value: string) => {
    setCustomHeaders(value);
    if (value.trim()) {
      if (validateJson(value)) {
        setHeaderError(null);
      } else {
        setHeaderError('Invalid JSON format');
      }
    } else {
      setHeaderError(null);
    }
  };

  const handleSave = () => {
    // Validate URL
    if (!url.trim()) {
      return;
    }
    try {
      new URL(url);
    } catch {
      return;
    }

    // Validate JSON fields
    if (!validateJson(contentType)) {
      setJsonError('Invalid JSON format in content data');
      return;
    }

    if (authType === 'custom' && !validateJson(customHeaders)) {
      setHeaderError('Invalid JSON format in custom headers');
      return;
    }

    const config: ApiDestinationConfig = {
      id: editingConfig?.id || `api-${Date.now()}`,
      name: name.trim() || `API Destination - ${new URL(url).hostname}`,
      url: url.trim(),
      authType,
      bearerToken: authType === 'bearer' ? bearerToken : undefined,
      basicUsername: authType === 'basic' ? basicUsername : undefined,
      basicPassword: authType === 'basic' ? basicPassword : undefined,
      customHeaders: authType === 'custom' ? customHeaders : undefined,
      contentType,
    };

    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-(--darkelbg) w-full max-w-2xl p-6 rounded shadow-xl border-1 border-(--secondary) max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingConfig ? 'Edit API Destination' : 'Configure API Destination'}
          </h2>
          <button
            onClick={onClose}
            className="text-(--secondary) hover:text-(--foreground) text-2xl transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name (optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My API Destination"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">HTTPS URL *</label>
            <input
              type="url"
              className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://api.example.com/posts"
              required
            />
            {url && !url.startsWith('https://') && (
              <p className="text-xs text-red-400 mt-1">URL must start with https://</p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Authentication</label>
            <select
              className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
              value={authType}
              onChange={e => setAuthType(e.target.value as typeof authType)}
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="custom">Custom Headers</option>
            </select>
          </div>

          {authType === 'bearer' && (
            <div>
              <label className="block text-sm mb-1">Bearer Token</label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                value={bearerToken}
                onChange={e => setBearerToken(e.target.value)}
                placeholder="Token"
              />
            </div>
          )}

          {authType === 'basic' && (
            <>
              <div>
                <label className="block text-sm mb-1">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                  value={basicUsername}
                  onChange={e => setBasicUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
                  value={basicPassword}
                  onChange={e => setBasicPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            </>
          )}

          {authType === 'custom' && (
            <div>
              <label className="block text-sm mb-1">Custom Headers (JSON)</label>
              <textarea
                className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary) font-mono text-sm"
                value={customHeaders}
                onChange={e => handleHeadersChange(e.target.value)}
                placeholder='{"Authorization": "Bearer YOUR_TOKEN", "X-API-Key": "YOUR_KEY"}'
                rows={4}
              />
              {headerError && (
                <p className="text-xs text-red-400 mt-1">{headerError}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Content Data Mapping (JSON)</label>
            <p className="text-xs text-(--muted) mb-2">
              Use placeholders: double curly braces like {'{'}title{'}'} will be replaced with actual values
            </p>
            <textarea
              className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary) font-mono text-sm"
              value={contentType}
              onChange={e => handleContentTypeChange(e.target.value)}
              placeholder='{"title": "{{title}}", "content": "{{content}}", "excerpt": "{{excerpt}}"}'
              rows={6}
            />
            {jsonError && (
              <p className="text-xs text-red-400 mt-1">{jsonError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              className="px-3 py-2 cursor-pointer rounded bg-transparent border-1 border-(--secondary)"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 cursor-pointer rounded bg-(--emphasis) text-white disabled:opacity-60"
              onClick={handleSave}
              disabled={!url.trim() || jsonError !== null || headerError !== null}
            >
              {editingConfig ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

