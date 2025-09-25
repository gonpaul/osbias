'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { vim } from "@replit/codemirror-vim";
import { keymap, drawSelection } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { defaultKeymap } from "@codemirror/commands";
import { useSelector, useDispatch } from 'react-redux';
import type { JournalEntry } from '@/lib/redux/slices/journalEntriesSlice';
import { setEntries } from '@/lib/redux/slices/journalEntriesSlice';

// Use currentJournalSlice for current, title, content, saveState, preview
import {
  setCurrent,
  setTitle,
  setContent,
  setSaveState,
  setPreview,
} from '@/lib/redux/slices/currentJournalSlice';

type ID = number;

function VimEditor({
  value,
  onChange,
  editable = true,
}: {
  value: string;
  onChange: (val: string) => void;
  editable?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Only create the editor once
    if (viewRef.current) return;

    const customTheme = EditorView.theme({
      // Thin caret (insert mode)
      ".cm-cursor": { borderLeftColor: "white" },
      // ".cm-fat-cursor .cm-cursor": { backgroundColor: "blue", opacity: 0.7, borderLeft: "none" },
      // ".cm-selectionBackground": { backgroundColor: "rgba(0,0,255,0.3)" },
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        // basicSetup.filter((ext) => ext !== lineNumbers()), // remove line numbers
        keymap.of([...defaultKeymap, ...historyKeymap]),
        history(),
        drawSelection(),
        vim(),
        // EditorView.editable.of(editable),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newVal = update.state.doc.toString();
            onChange(newVal);
          }
        }),
        customTheme,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep editor in sync with value prop (when switching entries)
  useEffect(() => {
    if (viewRef.current) {
      const currentVal = viewRef.current.state.doc.toString();
      if (value !== currentVal) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentVal.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        // border: "1px solid #333",
        // borderRadius: "0.5rem",
        background: "var(--darkelbg, #181a20)",
        minHeight: 240,
        height: "100%",
        width: "100%",
        fontSize: "1rem",
        overflow: "auto",
      }}
      tabIndex={0}
    />
  );
}


function InlineChatPopup({
  open,
  onClose,
  selectedText,
}: {
  open: boolean;
  onClose: () => void;
  selectedText: string;
}) {
  const [input, setInput] = useState('');
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [open, onClose]);

  // For demo, just echo the selected text and input
  // In real use, you would call an API here
  return open ? (
    <div
      ref={popupRef}
      className="fixed z-50 left-4/10 top-1/3 min-h-25 transform -translate-x-1/2 bg-(--background) border border-gray-700 rounded-lg shadow-lg p-4 w-[420px] max-w-[95vw]"
      tabIndex={-1}
      onClick={e => e.stopPropagation()}
    >
      {/* X close button in top right */}
      <button
        className="absolute top-6 right-8 text-gray-400 hover:text-gray-200 text-xl font-bold focus:outline-none"
        style={{ lineHeight: 1 }}
        onClick={onClose}
        aria-label="Close"
        tabIndex={0}
      >
        &times;
      </button>
      <input
        className="w-full px-2 py-1 rounded border-none focus:outline-none text-base mb-2"
        placeholder="Ask about the selected text..."
        value={input}
        onChange={e => setInput(e.target.value)}
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
      />
      <div className="flex justify-end gap-2">
        {/* In real use, add a "Send" button here */}
      </div>
    </div>
  ) : null;
}

export default function JournalEditor() {
  const dispatch = useDispatch();
  // Use journalEntries from Redux store
  const entries = useSelector((state: any) => state.journalEntries.entries as JournalEntry[]);
  // Use currentJournalSlice for current, title, content, saveState, preview
  const current = useSelector((state: any) => state.currentJournal.current as JournalEntry | null);
  const title = useSelector((state: any) => state.currentJournal.title as string);
  const content = useSelector((state: any) => state.currentJournal.content as string);
  const saveState = useSelector((state: any) => state.currentJournal.saveState as 'idle' | 'saving' | 'saved' | 'error');
  const preview = useSelector((state: any) => state.currentJournal.preview as boolean);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Track the latest title/content at the time of save
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef(content);

  // Inline chat popup state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSelectedText, setChatSelectedText] = useState('');

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  // When entries change, set current to first entry if not set
  useEffect(() => {
    if ((!current || !entries.find(e => e.id === current.id)) && entries.length > 0) {
      const first = entries[0];
      dispatch(setCurrent(first));
    }
    if (entries.length === 0) {
      dispatch(setCurrent(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const saveNow = async () => {
    if (!dirtyRef.current) return;
    dispatch(setSaveState('saving'));
    try {
      // Always use the latest value at save time
      const saveTitle = latestTitleRef.current;
      const saveContent = latestContentRef.current;
      if (!current || current.id === -1) {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: saveTitle || 'Untitled',
            content: saveContent,
          })
        });
        if (!res.ok) throw new Error('POST failed');
        const created = await res.json() as JournalEntry;
        dispatch(setEntries([created, ...entries]));
      } else {
        const res = await fetch(`/api/journal/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: saveTitle,
            content: saveContent
          })
        });
        if (!res.ok) throw new Error('PUT failed');
        const updated = await res.json() as JournalEntry;
        dispatch(setEntries(entries.map(x => x.id === updated.id ? updated : x)));
      }
      dispatch(setSaveState('saved'));
      dirtyRef.current = false;
    } catch (e) {
      dispatch(setSaveState('error'));
    }
  };

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    dispatch(setSaveState('idle'));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, current, entries]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const deleteEntry = async (id: ID) => {
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
  };

  const Saving = () => {
    let text = '';
    if (saveState === 'saving') text = 'Saving...';
    else if (saveState === 'saved') text = 'Saved';
    else if (saveState === 'error') text = 'Error';
    return (
      <span className="text-xs text-(--secondary)">
        {text}
      </span>
    );
  };

  // Keyboard shortcut: Alt+P to toggle preview
  const handlePreviewKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.altKey &&
      (e.key === 'p' || e.key === 'P')
    ) {
      e.preventDefault();
      dispatch(setPreview(!preview));
    }
  };

  // Handler for Ctrl+K shortcut in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ctrlKey for Windows/Linux, metaKey for Mac (Cmd)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      // Get selected text from textarea
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      setChatSelectedText(selected);
      setChatOpen(true);
    }
  };

  // Handler for Ctrl+K in VimEditor (if you enable it)
  // You could pass a similar prop to VimEditor and handle selection there

  // Handler for closing the chat popup
  const handleCloseChat = () => {
    setChatOpen(false);
    setTimeout(() => setChatSelectedText(''), 200);
  };

  return (
    <div className="flex flex-col h-full w-full px-6" tabIndex={-1}>
      <div className="flex items-center gap-2 py-4">
        <div className="flex-1" />
        <Saving />
        <button
          className={`cursor-pointer px-3 py-1 rounded text-sm
                      ${preview
                        ? 'bg-(--emphasis) text-white'
                        : 'bg-(--darkelbg) text-(--foreground)'}`}
          onClick={() => dispatch(setPreview(!preview))}
          onKeyDown={handlePreviewKeyDown}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      <input
        className="w-full px-3 py-2 mb-2 rounded border-none
                   focus:outline-none bg-transparent
                   text-xl font-semibold"
        placeholder="Title..."
        value={title}
        onChange={(e) => {
          dispatch(setTitle(e.target.value));
          // Update ref immediately so saveNow always gets latest
          latestTitleRef.current = e.target.value;
          scheduleSave();
        }}
      />

      {preview ? (
        <div className="flex-1 w-full rounded bg-transparent overflow-auto" style={{ padding: '0.75rem' }}>
          <MarkdownPreview content={content} />
        </div>
      ) : (
        <div className="flex-1 w-full relative">
          {/* <VimEditor
            value={content}
            onChange={val => {
              dispatch(setContent(val));
              latestContentRef.current = val;
              scheduleSave();
            }}
            onKeyDown={handleVimEditorKeyDown}
          /> */}
          <textarea
            className="w-full h-full min-h-[300px] px-3 py-2 rounded border-none focus:outline-none bg-transparent text-base font-mono resize-none"
            placeholder="Write your entry..."
            value={content}
            onChange={e => {
              dispatch(setContent(e.target.value));
              // Update ref immediately so saveNow always gets latest
              latestContentRef.current = e.target.value;
              scheduleSave();
            }}
            spellCheck={true}
            onKeyDown={handleTextareaKeyDown}
          />
          <InlineChatPopup
            open={chatOpen}
            onClose={handleCloseChat}
            selectedText={chatSelectedText}
          />
        </div>
      )}
    </div>
  );
}