'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FaHistory, FaPaperPlane, FaUser, FaRobot, FaTrash } from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';

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
  const t = useTranslations('Editor');
  const locale = useLocale();
  const [message, setMessage] = useState('');
  // Deprecated local tabs; sessions replace this
  const [messages, setMessages] = useState<Message[]>([]);

  const [sessions, setSessions] = useState<Array<{ id: number; name: string }>>([]);
  // Locally controlled set of session IDs that are shown as tabs
  const [visibleSessionIds, setVisibleSessionIds] = useState<number[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userChatPrefs, setUserChatPrefs] = useState<{ provider: string; model: string; maxTokens: number } | null>(null);

  // Load user AI preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/api/users/me/preferences", { credentials: "include" });
        if (p.ok) {
          const prefs = await p.json();
          setUserChatPrefs({
            provider: prefs.aiProvider || 'openai',
            model: prefs.aiModel || 'gpt-4o-mini',
            maxTokens: prefs.aiMaxTokens || 512,
          });
        }
      } catch {}
    })();
  }, []);
  // const tabs = ['General', 'Code', 'Debug'];

  const VISIBLE_KEY = 'chat_visible_session_ids';
  const ACTIVE_KEY = 'chat_active_session_id';
  
  // Helper function to check if a session ID is local (temp) or server-created
  const isLocalSession = (sessionId: number): boolean => {
    return sessionId > 1000000000000; // Timestamp-based temp IDs
  };

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
    
    // Only create server session when we have a message to send
    // For now, create a temporary local session ID
    const tempId = Date.now();
    const name = messages[0]?.content?.slice(0, 40) || t('newChat');
    
    // Create local session entry
    const localSession = { id: tempId, name };
    setSessions(prev => [localSession, ...prev]);
    setVisibleSessionIds(prev => [tempId, ...prev]);
    setActiveSessionId(tempId);
    
    return tempId;
  }

  const loadMessages = React.useCallback(async (sessionId: number) => {
    // Skip loading for local sessions (temp IDs)
    if (isLocalSession(sessionId)) {
      setMessages([]);
      return;
    }

    // NEW: avoid clobbering in-progress stream
    if (isStreamingRef.current) return;

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
  }, []);

  React.useEffect(() => {
    if (activeSessionId) {
      void loadMessages(activeSessionId);
    }
  }, [activeSessionId, loadMessages]);

  const controllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  async function deleteSession(sessionId: number) {
    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) return;

    try {
      if (!isLocalSession(sessionId)) {
        await fetch(`/api/chat/sessions/${sessionId}` , {
          method: 'DELETE',
          credentials: 'include',
        });
      }
    } catch {}

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setVisibleSessionIds(prev => prev.filter(id => id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }

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

      let sessionId = await ensureSession();
      
      // If this is a local session (temp ID), create server session now
      if (isLocalSession(sessionId)) {
        try {
          const tempId = sessionId;
          const local = sessions.find(s => s.id === tempId);
          const name = local?.name || messages[0]?.content?.slice(0, 40) || t('newChat');
          const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name })
          });
          if (res.ok) {
            const created = await res.json();
            // Update the session ID to the server-created one
            setSessions(prev => prev.map(s => s.id === tempId ? { ...s, id: created.id, name: created.name ?? s.name } : s));
            setVisibleSessionIds(prev => prev.map(id => id === tempId ? created.id : id));
            // Defer switching active session until after message persistence to avoid
            // triggering a load that clears in-progress streaming state.
            sessionId = created.id;
          }
        } catch {}
      }
      
      // Persist user message
      try {
        const persisted = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: 'user', content: newMessage.content })
        });
        if (persisted.ok) {
          // Now safe to switch active session to the real server ID (if it changed)
          setActiveSessionId(sessionId);
        }
      } catch {}

      // Stream from SSE endpoint
      try {
        isStreamingRef.current = true;
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        // TODO: wire provider/model from user preferences; defaulting to backend defaults
        const res = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: newMessage.content,
            provider: userChatPrefs?.provider,
            model: userChatPrefs?.model,
            sessionId,
            maxTokens: userChatPrefs?.maxTokens || 512,
          }),
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
      } finally {
        isStreamingRef.current = false;
        // Only now switch active session to the server ID to allow loadMessages to refresh
        // (If this was a temp→server conversion)
        setActiveSessionId(sessionId);
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
    return date.toLocaleTimeString(locale, { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`w-[300px] h-[88vh] overflow-hidden bg-(--background) grid grid-rows-[auto_1fr_auto] ${className}`}>
      {/* Header with Tabs */}
      <div className="p-4 border-b border-(--secondary)/60">
      
        <div className="flex items-center justify-between mb-3">
          <span className="flex-1 text-lg font-semibold text-(--foreground) text-center block">
            {t('chat')}
          </span>
          <button
            onClick={() => setIsHistoryOpen((v) => !v)}
            className="p-2 text-(--secondary) cursor-pointer hover:text-(--foreground) hover:bg-(--darkelbg) rounded-lg transition-colors ml-auto"
            title={t('chatHistory')}
          >
            <FaHistory className="w-8 h-8" />
          </button>
        </div>
        {/* Sessions (names only) */}
        <div className="relative h-20">
          <div
            className="absolute inset-0 flex flex-nowrap gap-1 overflow-x-auto \
            overflow-y-hidden items-center px-1 pt-4 pb-0"
            style={{ scrollbarGutter: 'stable both-edges' }}
          >
            <button
              onClick={() => {
                const name = prompt('New chat name') || t('newChat');
                // Create local session only - server session will be created when first message is sent
                const tempId = Date.now();
                const localSession = { id: tempId, name };
                setSessions(prev => [localSession, ...prev]);
                setVisibleSessionIds(prev => [tempId, ...prev]);
                setActiveSessionId(tempId);
                setMessages([]);
              }}
              className="px-3 py-1 text-xs rounded-md transition-colors cursor-pointer \
              text-(--secondary) hover:bg-(--darkelbg) hover:text-(--foreground) \
              flex-shrink-0"
            >
              + New
            </button>
            {sessions.filter(s => visibleSessionIds.includes(s.id)).map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-center gap-1 px-1 py-0.5 rounded-md \
                  whitespace-nowrap flex-shrink-0
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
                  aria-label={t('closeSession')}
                  title={t('closeSession')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>


      {isHistoryOpen && (
        <div className="border-t border-(--secondary)/20 w-full px-2 pt-4 pb-2 mt-3 \
        flex-shrink-0 h-fit max-h-[150px] overflow-y-auto">
          {sessions.length === 0 && (
            <div className="text-(--secondary) text-sm">{t('noSessions')}</div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={
                `flex items-center justify-between gap-2 px-4 py-2 rounded-md ` +
                (activeSessionId === s.id
                  ? 'bg-(--darkelbg) text-(--foreground)'
                  : 'text-(--secondary) hover:bg-(--emphasis) hover:text-(--foreground)')
              }
            >
              <button
                onClick={() => {
                  setActiveSessionId(s.id);
                  // If not visible, bring it back to tabs
                  setVisibleSessionIds(prev => prev.includes(s.id) ? prev : [s.id, ...prev]);
                  setIsHistoryOpen(false);
                }}
                className={`flex-1 text-left rounded-md cursor-pointer transition-colors text-sm`}
                title={s.name}
              >
                {s.name}
              </button>
                {!isLocalSession(s.id) && (
                  <button
                    onClick={() => void deleteSession(s.id)}
                    className="p-1 rounded cursor-pointer transition-colors duration-300"
                    aria-label={t('deleteSession')}
                    title={t('deleteSession')}
                  >
                    <FaTrash className="w-5 h-5 transition-colors duration-300 hover:text-red-600" />
                  </button>
                )}
              </div>
          ))}
        </div>
      )}

      </div>

      {/* Messages Area */}
      <div className="overflow-y-auto p-4 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex items-start pt-20 justify-center">
            <div className="text-center max-w-[90%]">
              <div className="mx-auto w-14 h-14 rounded-full bg-(--emphasis) flex items-center justify-center mb-3">
                <FaRobot className="w-8 h-8 text-white" />
              </div>
              <div className="text-(--foreground) font-semibold text-lg mb-1">{t('welcomeChat')}</div>
              <div className="text-(--secondary) text-sm mb-4">
                {t('welcomeChatDesc')}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  className="px-3 py-1.5 text-xs rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) transition-colors"
                  // onClick={() => setMessage('Summarize my recent notes into 3 bullet points.')}
                >
                  {t('summarizeNotes')}
                </button>
                <button
                  className="px-3 py-1.5 text-xs rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) transition-colors"
                  // onClick={() => setMessage('Brainstorm 5 ideas to improve focus today.')}
                >
                  {t('brainstormIdeas')}
                </button>
                <button
                  className="px-3 py-1.5 text-xs rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) transition-colors"
                  // onClick={() => setMessage('Create a step-by-step plan to learn a new topic.')}
                >
                  {t('makeAPlan')}
                </button>
              </div>
            </div>
          </div>
        )}
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
      <div className="p-4 border-t border-(--secondary)/60">
        <div className="flex">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize textarea
              const textarea = e.target;
              textarea.style.height = 'auto';
              textarea.style.height = Math.min(textarea.scrollHeight, 60) + 'px'; // Max 2 rows (30px per row)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[30px] h-15 max-h-[65px] pt-2 resize-none px-3 text-sm border-none rounded-s-lg bg-(--darkelbg) text-(--foreground) placeholder-(--secondary) focus:outline-none focus:ring-1 focus:ring-(--emphasis)/40 overflow-y-auto"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 cursor-pointer px-4 bg-(--emphasis) text-white rounded-e-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            <FaPaperPlane className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
