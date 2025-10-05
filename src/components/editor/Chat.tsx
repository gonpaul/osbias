'use client';

import React, { useRef, useState } from 'react';
import { FaHistory, FaPaperPlane, FaUser, FaRobot } from 'react-icons/fa';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatProps {
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ className = '' }) => {
  const [message, setMessage] = useState('');
  // Deprecated local tabs; sessions replace this
  const [messages, setMessages] = useState<Message[]>([]);

  const [sessions, setSessions] = useState<Array<{ id: number; name: string }>>([]);
  // Locally controlled set of session IDs that are shown as tabs
  const [visibleSessionIds, setVisibleSessionIds] = useState<number[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // const tabs = ['General', 'Code', 'Debug'];

  const VISIBLE_KEY = 'chat_visible_session_ids';
  const ACTIVE_KEY = 'chat_active_session_id';

  async function loadSessions() {
    try {
      const res = await fetch('/api/chat/sessions', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as Array<{ id: number; name: string }>;
        setSessions(data);
        const hasPersistedVisible = typeof window !== 'undefined' && !!localStorage.getItem(VISIBLE_KEY);
        if (!hasPersistedVisible && visibleSessionIds.length === 0) {
          setVisibleSessionIds(data.map(s => s.id));
        }
        const hasPersistedActive = typeof window !== 'undefined' && !!localStorage.getItem(ACTIVE_KEY);
        if (!hasPersistedActive && !activeSessionId && data.length > 0) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch {}
  }

  React.useEffect(() => {
    try {
      const rawVisible = typeof window !== 'undefined' ? localStorage.getItem(VISIBLE_KEY) : null;
      if (rawVisible) {
        const parsed = JSON.parse(rawVisible) as unknown;
        if (Array.isArray(parsed)) {
          const ids = parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n));
          setVisibleSessionIds(ids as number[]);
        }
      }
      const rawActive = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_KEY) : null;
      if (rawActive) {
        const n = Number(rawActive);
        if (Number.isFinite(n)) setActiveSessionId(n);
      }
    } catch {}
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist visible tabs selection
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(VISIBLE_KEY, JSON.stringify(visibleSessionIds));
      }
    } catch {}
  }, [visibleSessionIds]);

  // Persist last active tab
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && activeSessionId != null) {
        localStorage.setItem(ACTIVE_KEY, String(activeSessionId));
      }
    } catch {}
  }, [activeSessionId]);

  async function ensureSession(): Promise<number> {
    if (activeSessionId) return activeSessionId;
    const name = messages[0]?.content?.slice(0, 40) || 'New Chat';
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    const created = await res.json();
    setSessions(prev => [created, ...prev]);
    setVisibleSessionIds(prev => [created.id, ...prev]);
    setActiveSessionId(created.id);
    return created.id as number;
  }

  async function loadMessages(sessionId: number) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, { credentials: 'include' });
      if (res.ok) {
        const msgs = await res.json() as Array<{ id: number; role: 'user' | 'assistant'; content: string; created_at: string }>;
        const mapped: Message[] = msgs.map(m => ({
          id: String(m.id),
          content: m.content,
          sender: m.role,
          timestamp: new Date(m.created_at)
        }));
        setMessages(mapped);
      }
    } catch {}
  }

  React.useEffect(() => {
    if (activeSessionId) {
      void loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const controllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      // Start assistant streaming message placeholder
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          content: '',
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);

      const sessionId = await ensureSession();
      // Persist user message
      try {
        await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: 'user', content: newMessage.content })
        });
      } catch {}

      // Stream from SSE endpoint
      try {
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        // TODO: wire provider/model from user preferences; defaulting to backend defaults
        const res = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: newMessage.content }),
          signal: controllerRef.current.signal,
        });
        if (!res.ok || !res.body) throw new Error('Stream failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        let assistantBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split(/\n\n/);
          buffer = lines.pop() ?? '';

          for (const evt of lines) {
            // Expect lines like: "data: {json}"
            const dataLine = evt.split('\n').find(l => l.startsWith('data:')) || '';
            const json = dataLine.replace(/^data:\s*/, '');
            if (!json) continue;
            try {
              const payload = JSON.parse(json) as { text?: string; done?: boolean; error?: string };
              if (payload.error) throw new Error(payload.error);
              if (payload.text) {
                assistantBuffer += payload.text;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantBuffer } : m));
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
        // Save assistant message at end of stream
        try {
          await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role: 'assistant', content: assistantBuffer })
          });
        } catch {}
      } catch {
        // On error, append a small notice
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: (m.content || '') + '\n[stream error]' } : m));
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`w-[300px] max-h-[90vh] overflow-hidden bg-(--background) flex flex-col ${className}`}>
      {/* Header with Tabs */}
      <div className="p-4 border-b border-(--secondary)/60">
        <div className="flex items-center justify-between mb-3">
          <span className="flex-1 text-lg font-semibold text-(--foreground) text-center block">
            Chat
          </span>
          <button
            onClick={() => setIsHistoryOpen((v) => !v)}
            className="p-2 text-(--secondary) cursor-pointer hover:text-(--foreground) hover:bg-(--darkelbg) rounded-lg transition-colors ml-auto"
            title="Chat History"
          >
            <FaHistory className="w-8 h-8" />
          </button>
        </div>
        {/* Sessions (names only) */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {sessions.filter(s => visibleSessionIds.includes(s.id)).map((s, idx) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-1 py-0.5 rounded-md whitespace-nowrap
                ${activeSessionId === s.id ? 'bg-(--emphasis) text-white' : 'bg-(--darkelbg) text-(--gray-500)/80'}
              `}
            >
              <button
                onClick={() => setActiveSessionId(s.id)}
                className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors
                  ${activeSessionId === s.id ? 'text-white' : 'hover:bg-(--darkelbg) hover:text-(--foreground)'}
                `}
                title={s.name}
              >
                {s.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Hide from tabs only (keep in history)
                  setVisibleSessionIds(prev => {
                    const next = prev.filter(id => id !== s.id);
                    try {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(VISIBLE_KEY, JSON.stringify(next));
                      }
                    } catch {}
                    return next;
                  });
                  if (activeSessionId === s.id) {
                    // Prefer next visible session, else previous, else none
                    const visible = sessions.filter(x => x.id !== s.id && visibleSessionIds.includes(x.id));
                    const next = visible[idx] ?? visible[idx - 1] ?? null;
                    setActiveSessionId(next ? next.id : null);
                    setMessages([]);
                  }
                }}
                className={`px-1 py-1 text-xs rounded cursor-pointer transition-colors
                  ${activeSessionId === s.id ? 'hover:bg-white/20' : 'hover:bg-(--darkelbg) hover:text-(--foreground)'}
                `}
                aria-label={`Close ${s.name}`}
                title="Close session"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={async () => {
              const name = prompt('New chat name') || 'New Chat';
              try {
                const res = await fetch('/api/chat/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ name })
                });
                if (res.ok) {
                  const created = await res.json();
                  setSessions(prev => [created, ...prev]);
                  setVisibleSessionIds(prev => [created.id, ...prev]);
                  setActiveSessionId(created.id);
                  setMessages([]);
                }
              } catch {}
            }}
            className="px-3 py-1 text-xs rounded-md transition-colors cursor-pointer text-(--secondary) hover:bg-(--darkelbg) hover:text-(--foreground)"
          >
            + New
          </button>
        </div>
      </div>

      {isHistoryOpen && (
        <div className="border-b border-(--secondary)/60 px-4 py-2 flex-shrink-0 max-h-[300px] overflow-y-auto">
          {sessions.length === 0 && (
            <div className="text-(--secondary) text-sm">No sessions yet</div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id);
                // If not visible, bring it back to tabs
                setVisibleSessionIds(prev => prev.includes(s.id) ? prev : [s.id, ...prev]);
                setIsHistoryOpen(false);
              }}
              className={`block w-full text-left px-2 py-2 rounded-md cursor-pointer transition-colors text-sm
                ${activeSessionId === s.id ? 'bg-(--darkelbg) text-(--foreground)' : 'text-(--secondary) hover:bg-(--darkelbg) hover:text-(--foreground)'}
              `}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 mt-6 overflow-y-auto p-4 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-(--emphasis) rounded-full flex items-center justify-center">
                <FaRobot className="w-8 h-8 text-white" />
              </div>
            )}
            
            <div
              className={`
                max-w-[90%] p-3 rounded-lg
                ${msg.sender === 'user' 
                  ? 'bg-(--emphasis) text-white' 
                  : 'bg-(--darkelbg) text-(--foreground)'
                }
              `}
            >
              <div className="text-sm">{msg.content}</div>
              <div className={`text-xs mt-1 ${
                msg.sender === 'user' ? 'text-white/70' : 'text-(--secondary)'
              }`}>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
            
            {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-(--secondary) rounded-full flex items-center justify-center">
                <FaUser className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t mt-6 border-(--secondary)/60">
        <div className="flex">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-10 max-h-[100px] px-3 py-2 text-sm border-none rounded-s-lg bg-(--darkelbg) text-(--foreground) placeholder-(--secondary) focus:outline-none focus:ring-1 focus:ring-(--emphasis)/40 resize-y"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 cursor-pointer px-4 bg-(--emphasis) text-white rounded-e-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <FaPaperPlane className="h-full w-full" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
