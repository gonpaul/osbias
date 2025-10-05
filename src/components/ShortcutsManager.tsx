'use client';

import { useEffect } from 'react';
import { emitUIEvent } from '@/lib/uiEvents';

export default function ShortcutsManager() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea or contenteditable
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const isEditable = target?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';

      // Allow editor to handle its own shortcuts; only global when outside editor
      // We still allow Ctrl+/ for help globally

      // Ctrl/Cmd + K → open inline chat (handled inside editor via CodeMirror; here we fallback to global signal)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        if (!isEditable) {
          e.preventDefault();
          // Fallback: ask editor to open inline chat at cursor via custom event
          emitUIEvent('hello-widget-request');
        }
        return;
      }

      // Alias: Ctrl+Shift+P → paraphrase
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P')) {
        e.preventDefault();
        emitUIEvent('paraphrase-request');
        return;
      }

      // Ctrl/Cmd + / → toggle shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        emitUIEvent('toggle-shortcuts-help');
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return null;
}


