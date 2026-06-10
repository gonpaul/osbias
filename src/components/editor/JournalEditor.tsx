'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { emitUIEvent, onUIEvent } from '@/lib/uiEvents';
import { createRoot, Root } from 'react-dom/client';
import MarkdownPreview from './MarkdownPreview';
import ValidationHistory from './ValidationHistory';
import { EditorState, StateEffect, StateField, Compartment, Range } from "@codemirror/state";
import { EditorView } from "codemirror";
import { vim } from "@replit/codemirror-vim";
import { keymap, drawSelection, Decoration, WidgetType, DecorationSet } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { defaultKeymap } from "@codemirror/commands";
import { useSelector, useDispatch } from 'react-redux';
import { useTranslations } from 'next-intl';
import type { JournalEntry } from '@/lib/redux/slices/journalEntriesSlice';
import { setEntries, updateEntry } from '@/lib/redux/slices/journalEntriesSlice';
import { getModelsByProvider } from "@/lib/config/ai-models";
import { FaHistory } from 'react-icons/fa';

// Use currentJournalSlice for current, title, content, saveState, preview
import {
  setCurrent,
  setCurrentMeta,
  setTitle,
  setContent,
  setSaveState,
  setPreview,
} from '@/lib/redux/slices/currentJournalSlice';


// CodeMirror-based editor that can optionally enable Vim mode and supports
// embedding a popup as a line widget (block decoration) on Ctrl+K.
function CMEditor({
  value,
  onChange,
  vimEnabled = false,
  editable = true,
  locked = false,
  onUnlock,
  focusTick,
  t,
}: {
  value: string;
  onChange: (val: string) => void;
  editable?: boolean;
  vimEnabled?: boolean;
  locked?: boolean;
  onUnlock?: () => void;
  focusTick?: number;
  t: (key: string) => string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartmentRef = useRef<Compartment | null>(null);
  const editableCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effectsRef = useRef<{ addPopup: any; clearPopups: any } | null>(null);
  onChangeRef.current = onChange;
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  // (moved) publish info bridge is implemented inside JournalEditor, not CMEditor

  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) return;

    const customTheme = EditorView.theme({
      ".cm-cursor": { borderLeftColor: "white" },
      ".cm-selectionBackground, .cm-selectionLayer .cm-selectionBackground": {
        background: "var(--emphasis) !important"
      },
      ".cm-activeLine": {
        background: "#2a2a3a"
      },
      ".cm-placeholder-line": {
        color: "var(--secondary)",
        opacity: 0.6,
        userSelect: "none",
        pointerEvents: "none",
      },
      // Vim normal mode block (fat) cursor
      // ".cm-fat-cursor .cm-cursor": {
      //   backgroundColor: "#2a2a3a !important",
      //   borderLeft: "none !important",
      //   width: "auto !important",
      //   opacity: 1
      // },
      // ".cm-fat-cursor-mark": {
      //   backgroundColor: "#2a2a3a !important"
      // },
      // ".cm-fat-cursor": {
      //   caretColor: "transparent !important"
      // }
    });

    const addPopup = StateEffect.define<Range<Decoration>>();
    const clearPopups = StateEffect.define<null>();

    const popupField = StateField.define<{ deco: DecorationSet }>({
      create() {
        return { deco: Decoration.none };
      },
      update(field, tr) {
        let deco = field.deco.map(tr.changes);
        for (const e of tr.effects) {
          if (e.is(addPopup)) deco = deco.update({ add: [e.value] });
          if (e.is(clearPopups)) deco = Decoration.none;
        }
        return { deco };
      },
      provide: f => EditorView.decorations.from(f, v => v.deco),
    });

    // Store references to effects for use in other functions
    effectsRef.current = { addPopup, clearPopups };


    class SuggestionWidget extends WidgetType {
      private view: EditorView;
      private insertPos: number;
      private suggestion: string;
      private onClose: () => void;
      private root: Root | null = null;
      constructor(view: EditorView, insertPos: number, suggestion: string, onClose: () => void) {
        super();
        this.view = view;
        this.insertPos = insertPos;
        this.suggestion = suggestion;
        this.onClose = onClose;
      }
      eq(other: SuggestionWidget) {
        return other.suggestion === this.suggestion && other.insertPos === this.insertPos;
      }
      toDOM() {
        const container = document.createElement('div');
        container.style.margin = '8px 0';
        container.style.padding = '8px';
        container.style.border = '1px solid #374151';
        container.style.borderRadius = '8px';
        container.style.background = 'var(--background)';
        container.style.maxWidth = '95%';

        const root = createRoot(container);
        this.root = root;

        const AcceptReject = () => {
          return (
            <div className="flex flex-col gap-2">
              <div className="text-sm whitespace-pre-wrap break-words">{this.suggestion}</div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 rounded bg-(--emphasis) text-white text-sm"
                  onClick={() => {
                    const insert = "\n" + this.suggestion;
                    const tr = this.view.state.update({
                      changes: { from: this.insertPos, to: this.insertPos, insert },
                      selection: { anchor: this.insertPos + insert.length }
                    });
                    this.view.dispatch(tr);
                    this.view.dispatch({ effects: [clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  Accept
                </button>
                <button
                  className="px-3 py-1 rounded bg-(--darkelbg) text-(--foreground) text-sm"
                  onClick={() => {
                    this.view.dispatch({ effects: [clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        };

        this.root.render(<AcceptReject />);
        return container;
      }
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      ignoreEvent() { return true; }
    }

    class PopupWidget extends WidgetType {
      private selectedText: string;
      private onClose: () => void;
      private root: Root | null = null;
      private view: EditorView;
      private insertPos: number;
      constructor(opts: { selectedText: string; onClose: () => void; view: EditorView; insertPos: number }) {
        super();
        this.selectedText = opts.selectedText;
        this.onClose = opts.onClose;
        this.view = opts.view;
        this.insertPos = opts.insertPos;
      }
      eq(other: PopupWidget) { return other.selectedText === this.selectedText && other.insertPos === this.insertPos; }
      toDOM() {
        const container = document.createElement('div');
        container.style.margin = '8px 0';
        this.root = createRoot(container);
        this.root.render(
          <CMInlineChat
            selectedText={this.selectedText}
            onClose={this.onClose}
            onResult={(suggestion: string) => {
              const deco = Decoration.widget({
                widget: new SuggestionWidget(this.view, this.insertPos, suggestion, () => {
                  this.view.dispatch({ effects: [clearPopups.of(null)] });
                  Promise.resolve().then(() => this.view.focus());
                }),
                block: true,
                side: 1,
              }).range(this.insertPos);
              this.view.dispatch({ effects: [clearPopups.of(null), addPopup.of(deco)] });
            }}
            t={t}
          />
        );
        return container;
      }
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      // Let events inside the widget be handled by the widget's DOM (React input)
      // Returning true tells CodeMirror to ignore these events and not treat
      // them as editor interactions (fixes typing being inserted into editor).
      ignoreEvent() { return true; }
    }


    const vimCompartment = new Compartment();
    vimCompartmentRef.current = vimCompartment;
    const editableCompartment = new Compartment();
    editableCompartmentRef.current = editableCompartment;

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        // basicSetup,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        history(),
        drawSelection(),
        editableCompartment.of(EditorView.editable.of(editable)),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        customTheme,
        popupField,
        vimCompartment.of([]),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    const offInsert = onUIEvent('insert-text-at-cursor', (detail) => {
      const { text } = detail;
      const view = viewRef.current;
      if (text && view) {
        const selection = view.state.selection.main;
        const docLength = view.state.doc.length;
        
        // Determine insertion position:
        // 1. If there's a selection (selected text), replace it
        // 2. If cursor is at position 0 and no selection, insert at end
        // 3. Otherwise, insert at cursor position
        let insertPos = selection.from;
        let replaceTo = selection.to;
        if (insertPos === 0 && replaceTo === 0 && docLength > 0) {
          insertPos = docLength;
          replaceTo = docLength;
        }
        view.dispatch({
          changes: { from: insertPos, to: replaceTo, insert: text },
          selection: { anchor: insertPos + text.length }
        });
        view.focus();
      }
    });

    // Simple chord detection for Ctrl+D then P/C within a short window
    let dChordStage = 0; // 0 = none, 1 = got Ctrl+D
    let dChordTimer: number | null = null;

    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault();
        const sel = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(sel.from, sel.to);
        const line = view.state.doc.lineAt(sel.from);
        const deco = Decoration.widget({
          widget: new PopupWidget({
            selectedText,
            onClose: () => {
              view.dispatch({ effects: [clearPopups.of(null)] });
              // Return focus to the editor so user can type immediately
              // Use a microtask to ensure DOM updates have applied
              Promise.resolve().then(() => view.focus());
            },
            view,
            insertPos: sel.to
          }),
          block: true,
          side: 1,
        }).range(line.from);
        view.dispatch({ effects: [clearPopups.of(null), addPopup.of(deco)] });
      }

      // Ctrl+Shift+T → open template chooser
      // if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && (ev.key === 'T')) {
      //   ev.preventDefault();
      //   emitUIEvent('open-template-chooser');
      //   return;
      // }

      // Ctrl+/ → toggle shortcuts help
      if ((ev.ctrlKey || ev.metaKey) && ev.key === '/') {
        ev.preventDefault();
        emitUIEvent('toggle-shortcuts-help');
        return;
      }

      // Chord: Ctrl+D then P → paraphrase selection
      // Chord: Ctrl+D then C → bias check
      if (ev.ctrlKey || ev.metaKey) {
        if (ev.key === 'd' || ev.key === 'D') {
          ev.preventDefault();
          dChordStage = 1;
          if (dChordTimer) {
            window.clearTimeout(dChordTimer);
          }
          dChordTimer = window.setTimeout(() => {
            dChordStage = 0;
            dChordTimer = null;
          }, 800);
          return;
        }
        if ((ev.key === 'p' || ev.key === 'P') && dChordStage === 1) {
          ev.preventDefault();
          dChordStage = 0;
          if (dChordTimer) {
            window.clearTimeout(dChordTimer);
            dChordTimer = null;
          }
          emitUIEvent('paraphrase-request');
          return;
        }
        if ((ev.key === 'c' || ev.key === 'C') && dChordStage === 1) {
          ev.preventDefault();
          dChordStage = 0;
          if (dChordTimer) {
            window.clearTimeout(dChordTimer);
            dChordTimer = null;
          }
          emitUIEvent('bias-check-request');
          return;
        }
        if ((ev.key === 'j' || ev.key === 'J') && dChordStage === 1) {
          ev.preventDefault();
          dChordStage = 0;
          if (dChordTimer) {
            window.clearTimeout(dChordTimer);
            dChordTimer = null;
          }
          emitUIEvent('open-template-chooser');
          return;
        }
      }
    };
    view.dom.addEventListener('keydown', onKeyDown, true);

    return () => {
      view.dom.removeEventListener('keydown', onKeyDown, true);
      offInsert();
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Reconfigure editability based on props
  useEffect(() => {
    const view = viewRef.current;
    const editableCompartment = editableCompartmentRef.current;
    if (!view || !editableCompartment) return;
    const allow = editable && !locked;
    view.dispatch({ effects: editableCompartment.reconfigure(EditorView.editable.of(allow)) });
  }, [editable, locked]);


  // Refocus editor when parent requests (e.g., after preview -> editor toggle)
  useEffect(() => {
    if (focusTick == null) return;
    const view = viewRef.current;
    if (!view) return;
    // Use microtask to allow visibility/layout updates before focusing
    Promise.resolve().then(() => view.focus());
  }, [focusTick]);

  // Keep editor in sync with value prop
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  // Toggle Vim
  useEffect(() => {
    const view = viewRef.current;
    const vimCompartment = vimCompartmentRef.current;
    if (!view || !vimCompartment) return;
    view.dispatch({
      effects: vimCompartment.reconfigure(vimEnabled ? [vim()] : []),
    });
  }, [vimEnabled]);

  // Add fetchUserPreferences function
  const fetchUserPreferences = async () => {
    try {
      const res = await fetch('/api/users/me/preferences', { credentials: 'include' });
      if (res.ok) {
        const prefs = await res.json();
        return {
          provider: prefs.aiProvider || 'openrouter',
          model: prefs.aiModel || 'gpt-4o-mini',
          maxTokens: prefs.aiMaxTokens || 512
        };
      }
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
    }
    return { provider: 'openrouter', model: 'gpt-4o-mini', maxTokens: 512 };
  };

  useEffect(() => {
    class BiasWidget extends WidgetType {
      private view: EditorView;
      private originalText: string;
      private biasScore: number;
      private biasExplanation: string;
      private selectionFrom: number;
      private selectionTo: number;
      private onClose: () => void;
      private root: Root | null = null;
      
      constructor(
        view: EditorView, 
        originalText: string, 
        biasScore: number,
        biasExplanation: string,
        selectionFrom: number,
        selectionTo: number,
        onClose: () => void
      ) {
        super();
        this.view = view;
        this.originalText = originalText;
        this.biasScore = biasScore;
        this.biasExplanation = biasExplanation;
        this.selectionFrom = selectionFrom;
        this.selectionTo = selectionTo;
        this.onClose = onClose;
      }
      
      eq(other: BiasWidget) {
        return other.originalText === this.originalText && 
               other.biasScore === this.biasScore &&
               other.biasExplanation === this.biasExplanation &&
               other.selectionFrom === this.selectionFrom &&
               other.selectionTo === this.selectionTo;
      }
      
      toDOM() {
        const container = document.createElement('div');
        container.setAttribute('contenteditable', 'false');
        container.style.userSelect = 'none';
        container.style.setProperty('-webkit-user-select', 'none');
        container.style.setProperty('-ms-user-select', 'none');
        container.style.margin = '8px 0';
        container.style.padding = '12px';
        container.style.border = '1px solid #374151';
        container.style.borderRadius = '8px';
        container.style.background = 'var(--background)';
        container.style.maxWidth = '95%';

        const root = createRoot(container);
        this.root = root;

        const BiasResult = () => {
          // Ensure biasScore is a valid number between 0 and 1
          const validBiasScore = isNaN(this.biasScore) || this.biasScore < 0 || this.biasScore > 1 
            ? 0.5 
            : this.biasScore;
          
          // Calculate color based on bias score (0 = green, 1 = red)
          const red = Math.round(255 * validBiasScore);
          const green = Math.round(255 * (1 - validBiasScore));
          const color = `rgb(${red}, ${green}, 0)`;
          
          return (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-gray-400 mb-1">{t('biasAnalysis')}</div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-15 h-15 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: color }}
                >
                  {Math.round(validBiasScore * 100)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                  {`Bias Score: ${(validBiasScore * 100).toFixed(1)}%`}
                  </div>
                  <div className="text-xs text-gray-400">
                  {validBiasScore < 0.3 ? t('lowBias') : validBiasScore < 0.7 ? t('moderateBias') : t('highBias')}
                  </div>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">{t('explanation')}</div>
                {this.biasExplanation}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 rounded bg-(--darkelbg) text-(--foreground) text-sm hover:opacity-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          );
        };

        this.root.render(<BiasResult />);
        return container;
      }
      
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      
      ignoreEvent() { return true; }
    }

    class ParaphraseWidget extends WidgetType {
      private view: EditorView;
      private originalText: string;
      private paraphrasedText: string;
      private selectionFrom: number;
      private selectionTo: number;
      private onClose: () => void;
      private root: Root | null = null;
      
      constructor(
        view: EditorView, 
        originalText: string, 
        paraphrasedText: string,
        selectionFrom: number,
        selectionTo: number,
        onClose: () => void
      ) {
        super();
        this.view = view;
        this.originalText = originalText;
        this.paraphrasedText = paraphrasedText;
        this.selectionFrom = selectionFrom;
        this.selectionTo = selectionTo;
        this.onClose = onClose;
      }
      
      eq(other: ParaphraseWidget) {
        return other.originalText === this.originalText && 
               other.paraphrasedText === this.paraphrasedText &&
               other.selectionFrom === this.selectionFrom &&
               other.selectionTo === this.selectionTo;
      }
      
      toDOM() {
        const container = document.createElement('div');
        container.setAttribute('contenteditable', 'false');
        container.style.userSelect = 'none';
        container.style.setProperty('-webkit-user-select', 'none');
        container.style.setProperty('-ms-user-select', 'none');
        container.style.margin = '8px 0';
        container.style.padding = '12px';
        container.style.border = '1px solid #374151';
        container.style.borderRadius = '8px';
        container.style.background = 'var(--background)';
        container.style.maxWidth = '95%';

        const root = createRoot(container);
        this.root = root;

        const ParaphraseResult = () => {
          return (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-gray-400 mb-1">{t('paraphrased')}</div>
              <div className="text-sm whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">
                {this.paraphrasedText}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 rounded bg-(--emphasis) text-white text-sm hover:opacity-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const tr = this.view.state.update({
                      changes: { 
                        from: this.selectionFrom, 
                        to: this.selectionTo, 
                        insert: this.paraphrasedText 
                      },
                      selection: { anchor: this.selectionFrom + this.paraphrasedText.length }
                    });
                    this.view.dispatch(tr);
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  {t('accept')}
                </button>
                <button
                  className="px-3 py-1 rounded bg-(--darkelbg) text-(--foreground) text-sm hover:opacity-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  {t('reject')}
                </button>
              </div>
            </div>
          );
        };

        this.root.render(<ParaphraseResult />);
        return container;
      }
      
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      
      ignoreEvent() { return true; }
    }

    // Data structures for Idea Validation
    interface ValidationStep {
      id: string;
      proposition: string;
      isValid: boolean;
      confidence: number; // 0-1
      reasoning: string;
      dependencies: string[]; // IDs of previous steps this depends on
      environment: string; // Context where this should be validated
    }

    interface ValidationResult {
      overallValid: boolean;
      steps: ValidationStep[];
      summary: string;
      recommendations: string[];
    }

    class IdeaValidationWidget extends WidgetType {
      private view: EditorView;
      private originalText: string;
      private validationResult: ValidationResult;
      private selectionFrom: number;
      private selectionTo: number;
      private onClose: () => void;
      private root: Root | null = null;
      
      constructor(
        view: EditorView, 
        originalText: string, 
        validationResult: ValidationResult,
        selectionFrom: number,
        selectionTo: number,
        onClose: () => void
      ) {
        super();
        this.view = view;
        this.originalText = originalText;
        this.validationResult = validationResult;
        this.selectionFrom = selectionFrom;
        this.selectionTo = selectionTo;
        this.onClose = onClose;
      }
      
      eq(other: IdeaValidationWidget) {
        return other.originalText === this.originalText && 
               JSON.stringify(other.validationResult) === JSON.stringify(this.validationResult) &&
               other.selectionFrom === this.selectionFrom &&
               other.selectionTo === this.selectionTo;
      }
      
      toDOM() {
        const container = document.createElement('div');
        container.style.margin = '8px 0';
        container.style.padding = '12px';
        container.style.border = '1px solid #374151';
        container.style.borderRadius = '8px';
        container.style.background = 'var(--background)';
        container.style.maxWidth = '95%';

        const root = createRoot(container);
        this.root = root;

        const ValidationResult = () => {
          const validSteps = this.validationResult.steps.filter(step => step.isValid).length;
          const totalSteps = this.validationResult.steps.length;
          const overallStatus = this.validationResult.overallValid ? t('valid') : t('invalid');
          const statusColor = this.validationResult.overallValid ? 'text-green-400' : 'text-red-400';

          return (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-400 mb-1">{t('ideaValidationResults')}</div>

              {/* Overall Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                <div className={`text-lg font-bold ${statusColor}`}>
                  {overallStatus}
                </div>
                <div className="text-sm text-gray-300">
                  {`${validSteps}/${totalSteps} propositions valid`}
                </div>
              </div>

              {/* Validation Chain */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">{t('validationChain')}</div>
                {this.validationResult.steps.map((step, index) => {
                  const stepStatus = step.isValid ? t('valid') : t('invalid');
                  const stepColor = step.isValid ? 'text-green-400' : 'text-red-400';
                  const confidenceColor = step.confidence > 0.7 ? 'text-green-400' :
                                        step.confidence > 0.4 ? 'text-yellow-400' : 'text-red-400';

                  return (
                    <div key={step.id} className="border border-gray-600 rounded p-3 bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-200">
                          {t('step') + ' ' + (index + 1) + ': ' + step.proposition}
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`text-xs font-bold ${stepColor}`}>
                            {stepStatus}
                          </span>
                          <span className={`text-xs ${confidenceColor}`}>
                            ({Math.round(step.confidence * 100)}% confidence)
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 mb-1">
                        {t('environment') + ': ' + step.environment}
                      </div>

                      <div className="text-sm text-gray-300 bg-gray-700 p-2 rounded">
                        <div className="text-xs text-gray-400 mb-1">{t('reasoning') + ':'}</div>
                        {step.reasoning}
                      </div>

                      {step.dependencies.length > 0 && (
                        <div className="text-xs text-gray-400 mt-2">
                          {t('dependencies') + ': ' + step.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {this.validationResult.summary && (
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-sm font-medium text-gray-300 mb-2">{t('summary') + ':'}</div>
                  <div className="text-sm text-gray-300">{this.validationResult.summary}</div>
                </div>
              )}

              {/* Recommendations */}
              {this.validationResult.recommendations.length > 0 && (
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-sm font-medium text-gray-300 mb-2">{t('recommendations') + ':'}</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {this.validationResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 rounded bg-(--darkelbg) text-(--foreground) text-sm hover:opacity-80"
                  onClick={() => {
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          );
        };

        this.root.render(<ValidationResult />);
        return container;
      }
      
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      
      ignoreEvent() { return true; }
    }

    class HelloWidget extends WidgetType {
      private view: EditorView;
      private onClose: () => void;
      private onUnlock?: () => void;
      private root: Root | null = null;
      
      constructor(view: EditorView, onClose: () => void, onUnlock?: () => void) {
        super();
        this.view = view;
        this.onClose = onClose;
        this.onUnlock = onUnlock;
      }
      
      eq() { return true; }
      
      toDOM() {
        const container = document.createElement('div');
        const root = createRoot(container);
        this.root = root;

        const TypewriterText = ({ text, speed = 50 }: { text: string; speed?: number }) => {
          const [displayText, setDisplayText] = React.useState('');
          const [currentIndex, setCurrentIndex] = React.useState(0);
          const [showCursor, setShowCursor] = React.useState(true);

          React.useEffect(() => {
            if (currentIndex < text.length) {
              const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
              }, speed);
              return () => clearTimeout(timer);
            }
          }, [currentIndex, text, speed]);

          // Cursor blinking effect
          React.useEffect(() => {
            const cursorTimer = setInterval(() => {
              setShowCursor(prev => !prev);
            }, 500);
            return () => clearInterval(cursorTimer);
          }, []);

          return (
            <span>
              {displayText}
              {currentIndex < text.length && <span className="animate-pulse">|</span>}
            </span>
          );
        };

        const HelloContent = () => {
          return (
            <div className="flex flex-col w-9/10 items-center mx-auto py-6 my-4 bg-(--darkelbg) gap-6">
              <div className="text-xl max-w-2xl text-gray-300 text-center">
                <TypewriterText text={t('welcomeEntry')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                <div
                  className="cursor-pointer rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 bg-(--background) p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  onClick={() => {
                    emitUIEvent('open-journal-templates');
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  <div className="text-center pb-6 pt-3">
                    <div className="text-2xl mb-3">📝</div>
                    <div className="text-lg font-semibold text-white mb-2">{t('journalTemplate')}</div>
                    <div className="text-sm text-gray-400">
                      {t('journalTemplateDesc')}
                    </div>
                  </div>
                </div>

                <div
                  className="cursor-pointer rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 bg-(--background) p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  onClick={() => {
                    emitUIEvent('open-framework-templates');
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                  }}
                >
                  <div className="text-center pb-6 pt-3">
                    <div className="text-2xl mb-3">🧠</div>
                    <div className="text-lg font-semibold text-white mb-2">{t('frameworkTemplate')}</div>
                    <div className="text-sm text-gray-400">
                      {t('frameworkTemplateDesc')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  className="px-4 py-2 rounded bg-(--darkelbg) text-(--foreground) text-sm hover:opacity-80 border border-(--secondary)/30 duration-200 transition-opacity cursor-pointer"
                  onClick={() => {
                    this.view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
                    Promise.resolve().then(() => this.view.focus());
                    if (this.onUnlock) this.onUnlock();
                  }}
                >
                  {t('continueBlank')}
                </button>
              </div>
            </div>
          );
        };

        this.root.render(<HelloContent />);
        return container;
      }
      
      destroy(dom: HTMLElement) {
        const root = this.root;
        this.root = null;
        if (root) {
          Promise.resolve().then(() => root.unmount());
        }
        super.destroy(dom);
      }
      
      ignoreEvent() { return true; }
    }

    const performBiasCheck = async (view: EditorView, text: string, from: number, to: number) => {
      try {
        // Show loading state
        const loadingDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.setAttribute('contenteditable', 'false');
              div.style.userSelect = 'none';
              div.style.setProperty('-webkit-user-select', 'none');
              div.style.setProperty('-ms-user-select', 'none');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #374151';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-gray-400">${t('analyzingBias')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: 1,
        }).range(to);
        
        // Insert loading widget and restore selection immediately
        const biasLoadingOriginalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(loadingDeco)] });
        view.dispatch({ selection: biasLoadingOriginalSelection, scrollIntoView: false });
        view.focus();
        
        // Get user preferences
        const userPrefs = await fetchUserPreferences();
        
        // Call the AI API for bias analysis
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: `Analyze the following text for bias. Provide a bias score from 0 to 1 (where 0 = no bias, 1 = high bias) and an explanation. Format your response as JSON with "biasScore" (number) and "explanation" (string) fields:\n\n"${text}"`,
            system: 'You are a bias detection assistant. Analyze text for various types of bias including gender, racial, cultural, political, and other forms of bias. Provide a numerical score from 0 to 1 and a clear explanation of any biases found. Return your response as valid JSON with "biasScore" and "explanation" fields.',
            provider: userPrefs.provider,
            model: userPrefs.model,
            maxTokens: userPrefs.maxTokens,
          })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Bias analysis failed (${res.status})`);
        }
        
        const data = await res.json() as { text: string };
        const responseText = data.text.trim();
        
        // Parse the JSON response
        let biasScore: number;
        let biasExplanation: string;
        
        try {
          // Extract JSON from markdown code blocks if present
          let jsonText = responseText;
          const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
          }
          
          const parsed = JSON.parse(jsonText);
          const rawScore = parsed.biasScore;
          
          // Validate and normalize the bias score
          if (typeof rawScore === 'number' && !isNaN(rawScore)) {
            biasScore = Math.max(0, Math.min(1, rawScore));
          } else if (typeof rawScore === 'string') {
            const parsedScore = parseFloat(rawScore);
            biasScore = isNaN(parsedScore) ? 0.5 : Math.max(0, Math.min(1, parsedScore));
          } else {
            biasScore = 0.5; // Default fallback
          }
          
          biasExplanation = parsed.explanation || 'No explanation provided.';
        } catch (parseError) {
          // Fallback parsing if JSON parsing fails
          console.warn('Failed to parse bias analysis JSON:', parseError);
          
          // Try to extract bias score from the text (look for patterns like "0.7", "70%", "score: 0.8", etc.)
          const scorePatterns = [
            /(?:bias\s+)?score[:\s]*([0-9.]+)/i,
            /([0-9.]+)\s*(?:out\s+of\s+1|\/1|%)/i,
            /(?:score|bias)[:\s]*([0-9.]+)/i
          ];
          
          let scoreMatch = null;
          for (const pattern of scorePatterns) {
            scoreMatch = responseText.match(pattern);
            if (scoreMatch) break;
          }
          
          if (scoreMatch) {
            let extractedScore = parseFloat(scoreMatch[1]);
            // If the score is a percentage (like 70), convert to decimal (0.7)
            if (extractedScore > 1) {
              extractedScore = extractedScore / 100;
            }
            biasScore = Math.max(0, Math.min(1, extractedScore));
          } else {
            // Default to 0.5 if no score found
            biasScore = 0.5;
          }
          
          // Use the full response as explanation, but clean it up
          biasExplanation = responseText
            .replace(/^(?:bias\s+)?(?:analysis|score)[:\s]*/i, '')
            .replace(/^\d+[.\d]*\s*(?:out\s+of\s+1|\/1|%)?\s*/i, '')
            .trim() || 'Bias analysis completed.';
        }
        
        // Replace loading with bias result
        const biasDeco = Decoration.widget({
          widget: new BiasWidget(
            view, 
            text, 
            biasScore,
            biasExplanation,
            from, 
            to, 
            () => {
              view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
              Promise.resolve().then(() => view.focus());
            }
          ),
          block: true,
          side: 1,
        }).range(to);
        
        // Insert widget and restore selection immediately
        const biasOriginalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(biasDeco)] });
        view.dispatch({ selection: biasOriginalSelection, scrollIntoView: false });
        view.focus();
        
      } catch (error) {
        console.error('Bias analysis error:', error);
        // Show error state
        const errorDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #dc2626';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-red-400">${t('biasError')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: 1,
        }).range(from);
        
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(errorDeco)] });
      }
    };

    const performParaphrase = async (view: EditorView, text: string, from: number, to: number) => {
      try {
        // Show loading state
        const loadingDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.setAttribute('contenteditable', 'false');
              div.style.userSelect = 'none';
              div.style.setProperty('-webkit-user-select', 'none');
              div.style.setProperty('-ms-user-select', 'none');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #374151';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-gray-400">${t('paraphrasing')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: -1,
        }).range(from);
        
        // Insert loading widget and restore selection immediately
        const loadingOriginalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(loadingDeco)] });
        view.dispatch({ selection: loadingOriginalSelection, scrollIntoView: false });
        view.focus();
        
        // Get user preferences
        const userPrefs = await fetchUserPreferences();
        
        // Call the AI API for paraphrasing
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: `Please paraphrase the following text while maintaining its original meaning and tone:\n\n"${text}"`,
            system: 'You are a helpful writing assistant. Paraphrase the given text while preserving the original meaning, tone, and intent. Make it clear and well-written. Return only the paraphrased result without quotes',
            provider: userPrefs.provider,
            model: userPrefs.model,
            maxTokens: userPrefs.maxTokens,
          })
        });
        
        if (!res.ok) {
          let errMsg = `Paraphrasing failed (${res.status})`;
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {
            const text = await res.text().catch(() => '');
            if (text) errMsg = `${errMsg}: ${text.substring(0, 100)}`;
          }
          throw new Error(errMsg);
        }
        
        const data = await res.json() as { text: string };
        const paraphrasedText = data.text.trim();
        
        // Replace loading with paraphrase result
        const paraphraseDeco = Decoration.widget({
          widget: new ParaphraseWidget(
            view, 
            text, 
            paraphrasedText, 
            from, 
            to, 
            () => {
              view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
              Promise.resolve().then(() => view.focus());
            }
          ),
          block: true,
          side: -1,
        }).range(from);
        
        // Insert widget and immediately restore original selection to avoid including widget
        const originalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(paraphraseDeco)] });
        view.dispatch({ selection: originalSelection, scrollIntoView: false });
        view.focus();
        
      } catch (error) {
        console.error('Paraphrasing error:', error);
        // Show error state
        const errorDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #dc2626';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-red-400">${t('paraphraseError')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: 1,
        }).range(from);
        
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(errorDeco)] });
      }
    };

    const performIdeaValidation = async (view: EditorView, text: string, from: number, to: number) => {
      try {
        // Show loading state
        const loadingDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.setAttribute('contenteditable', 'false');
              div.style.userSelect = 'none';
              div.style.setProperty('-webkit-user-select', 'none');
              div.style.setProperty('-ms-user-select', 'none');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #374151';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-gray-400">${t('validatingIdea')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: 1,
        }).range(to);
        
        // Insert loading widget and restore selection immediately
        const validationLoadingOriginalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(loadingDeco)] });
        view.dispatch({ selection: validationLoadingOriginalSelection, scrollIntoView: false });
        view.focus();
        
        // Get user preferences
        const userPrefs = await fetchUserPreferences();
        
        // Call the AI API for idea validation
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: `Analyze the following text and break it down into a logical validation chain. For each proposition in the chain, extract the core proposition, identify its logical dependencies on previous propositions, determine the appropriate validation environment/context, assess validity with confidence score (0-1), and provide reasoning for the assessment.

Text: "${text}"

Return as JSON with this structure:
{
  "overallValid": boolean,
  "steps": [
    {
      "id": "step_1",
      "proposition": "string",
      "isValid": boolean,
      "confidence": number,
      "reasoning": "string",
      "dependencies": ["step_0"],
      "environment": "string"
    }
  ],
  "summary": "string",
  "recommendations": ["string"]
}`,
            system: 'You are an idea validation assistant. Break down ideas into logical propositions and validate each one in its appropriate context. Consider market conditions, technical feasibility, resource availability, and other relevant factors. Provide clear reasoning for each validation and actionable recommendations for improvement.',
            provider: userPrefs.provider,
            model: userPrefs.model,
            maxTokens: userPrefs.maxTokens,
          })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Idea validation failed (${res.status})`);
        }
        
        const data = await res.json() as { text: string };
        const responseText = data.text.trim();
        console.log(data);
        console.log(responseText);
        
        // Parse the JSON response
        let validationResult: ValidationResult;
        
        try {
          // Extract JSON from markdown code blocks if present
          let jsonText = responseText;
          const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
          }
          
          const parsed = JSON.parse(jsonText);
          
          // Validate the structure
          if (!parsed.steps || !Array.isArray(parsed.steps)) {
            throw new Error('Invalid response structure');
          }
          
          // Ensure all steps have required fields
          const steps = parsed.steps.map((step: Record<string, unknown>, index: number) => ({
            id: (typeof step.id === 'string' ? step.id : `step_${index + 1}`),
            proposition: (typeof step.proposition === 'string' ? step.proposition : 'Unknown proposition'),
            isValid: Boolean(step.isValid),
            confidence: Math.max(0, Math.min(1, typeof step.confidence === 'number' ? step.confidence : 0.5)),
            reasoning: (typeof step.reasoning === 'string' ? step.reasoning : 'No reasoning provided'),
            dependencies: Array.isArray(step.dependencies) ? step.dependencies as string[] : [],
            environment: (typeof step.environment === 'string' ? step.environment : 'General')
          }));
          
          validationResult = {
            overallValid: Boolean(parsed.overallValid),
            steps: steps,
            summary: parsed.summary || 'No summary provided',
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
          };
        } catch (parseError) {
          // Fallback parsing if JSON parsing fails
          console.warn('Failed to parse idea validation JSON:', parseError);
          
          // Create a fallback validation result
          validationResult = {
            overallValid: false,
            steps: [{
              id: 'step_1',
              proposition: 'Unable to parse validation results',
              isValid: false,
              confidence: 0,
              reasoning: 'The AI response could not be parsed. Please try again.',
              dependencies: [],
              environment: 'Error'
            }],
            summary: 'Validation failed due to parsing error',
            recommendations: ['Try rephrasing your idea or try again later']
          };
        }
        
        // Save validation history
        try {
          await fetch('/api/validation-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              original_text: text,
              validation_result: validationResult,
              ai_provider: userPrefs.provider,
              ai_model: userPrefs.model,
              text_start: from,
              text_end: to,
              is_full_document: from === 0 && to === view.state.doc.length
            })
          });
        } catch (historyError) {
          console.warn('Failed to save validation history:', historyError);
          // Don't fail the validation if history saving fails
        }
        
        // Replace loading with validation result
        const resultDeco = Decoration.widget({
          widget: new IdeaValidationWidget(
            view,
            text,
            validationResult,
            from,
            to,
            () => {
              view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
              Promise.resolve().then(() => view.focus());
            }
          ),
          block: true,
          side: 1,
        }).range(to);
        
        // Insert widget and restore selection immediately
        const validationOriginalSelection = view.state.selection;
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(resultDeco)] });
        view.dispatch({ selection: validationOriginalSelection, scrollIntoView: false });
        view.focus();
        
      } catch (error) {
        console.error('Idea validation error:', error);
        
        // Show error state
        const errorDeco = Decoration.widget({
          widget: new (class extends WidgetType {
            toDOM() {
              const div = document.createElement('div');
              div.style.margin = '8px 0';
              div.style.padding = '8px';
              div.style.border = '1px solid #dc2626';
              div.style.borderRadius = '8px';
              div.style.background = 'var(--background)';
              div.style.maxWidth = '95%';
              div.innerHTML = `<div class="text-sm text-red-400">${t('validationError')}</div>`;
              return div;
            }
            ignoreEvent() { return true; }
          })(),
          block: true,
          side: 1,
        }).range(from);
        
        view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(errorDeco)] });
      }
    };

    const handleBiasCheckRequest = async () => {
      const view = viewRef.current;
      if (!view) return;
      
      const sel = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(sel.from, sel.to);
      
      if (!selectedText.trim()) {
        // No text selected, ask user for confirmation to analyze entire content
        const fullContent = view.state.doc.toString();
        if (fullContent.trim()) {
          const confirmed = window.confirm(
            'No text is selected. Would you like to analyze the entire document for bias?'
          );
          if (confirmed) {
            await performBiasCheck(view, fullContent, 0, fullContent.length);
          }
        } else {
          alert('No content to analyze.');
        }
      } else {
        // Analyze selected text
        await performBiasCheck(view, selectedText, sel.from, sel.to);
      }
    };

    const handleParaphraseRequest = async () => {
      const view = viewRef.current;
      if (!view) return;
      
      const sel = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(sel.from, sel.to);
      
      if (!selectedText.trim()) {
        // No text selected, ask user for confirmation to paraphrase entire content
        const fullContent = view.state.doc.toString();
        if (fullContent.trim()) {
          const confirmed = window.confirm(
            'No text is selected. Would you like to paraphrase the entire document?'
          );
          if (confirmed) {
            await performParaphrase(view, fullContent, 0, fullContent.length);
          }
        } else {
          alert('No content to paraphrase.');
        }
      } else {
        // Paraphrase selected text
        await performParaphrase(view, selectedText, sel.from, sel.to);
      }
    };

    const handleIdeaValidationRequest = async () => {
      const view = viewRef.current;
      if (!view) return;
      
      const sel = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(sel.from, sel.to);
      
      if (!selectedText.trim()) {
        // No text selected, ask user for confirmation to validate entire content
        const fullContent = view.state.doc.toString();
        if (fullContent.trim()) {
          const confirmed = window.confirm(
            'No text is selected. Would you like to validate the entire document?'
          );
          if (confirmed) {
            await performIdeaValidation(view, fullContent, 0, fullContent.length);
          }
        } else {
          alert('No content to validate.');
        }
      } else {
        // Validate selected text
        await performIdeaValidation(view, selectedText, sel.from, sel.to);
      }
    };

    const handleHelloWidgetRequest = async () => {
      const view = viewRef.current;
      if (!view) return;
      
      // Show the hello widget at the beginning of the document
      const helloDeco = Decoration.widget({
        widget: new HelloWidget(
          view,
          () => {
            view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null)] });
            Promise.resolve().then(() => view.focus());
          },
          () => { if (onUnlockRef.current) onUnlockRef.current(); }
        ),
        block: true,
        side: 1,
      }).range(0);
      
      view.dispatch({ effects: [effectsRef.current!.clearPopups.of(null), effectsRef.current!.addPopup.of(helloDeco)] });
    };
    
    const offBias = onUIEvent('bias-check-request', () => handleBiasCheckRequest());
    const offPara = onUIEvent('paraphrase-request', () => handleParaphraseRequest());
    const offIdea = onUIEvent('idea-validation-request', () => handleIdeaValidationRequest());
    const offHello = onUIEvent('hello-widget-request', () => handleHelloWidgetRequest());
    return () => {
      offBias();
      offPara();
      offIdea();
      offHello();
    };
  }, []);

  return (
    <div
      ref={editorRef}
      className="bg-(--) min-h-[240px] h-full w-full text-base
      overflow-auto focus:outline-none"
      tabIndex={0}
    />
  );
}

function CMInlineChat({ selectedText, onClose, onResult, t }: { selectedText: string; onClose: () => void; onResult: (s: string) => void; t: (key: string) => string }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<{provider: string, model: string, maxTokens: number} | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, []);
  
  // Fetch user AI preferences
  useEffect(() => {
    const fetchUserPrefs = async () => {
      try {
        const res = await fetch('/api/users/me/preferences', { credentials: 'include' });
        if (res.ok) {
          const prefs = await res.json();
          const provider = prefs.aiProvider || 'openai';
          const model = prefs.aiModel || 'gpt-4o-mini';
          const maxTokens = prefs.aiMaxTokens || 512;
          setUserPrefs({ provider, model, maxTokens });
          setSelectedModel(model);
          setMaxTokens(maxTokens);
        }
      } catch (error) {
        console.error('Failed to fetch user preferences:', error);
        // Fallback to default
        setUserPrefs({ provider: 'openai', model: 'gpt-4o-mini', maxTokens: 512 });
        setSelectedModel('gpt-4o-mini');
        setMaxTokens(512);
      }
    };
    fetchUserPrefs();
  }, []);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !userPrefs || !selectedModel) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: input + (selectedText ? `\n\nSelected text:\n${selectedText}` : ''),
          system: selectedText ? `The user has selected the following text: "${selectedText}". Respond to their prompt in the context of this selection.` : undefined,
          provider: userPrefs.provider,
          model: selectedModel,
          maxTokens: maxTokens,
        })
      });
      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json() as { text: string };
      const suggestion = data?.text ?? '';
      console.log(suggestion);
      onResult(suggestion);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="z-50 min-h-25 relative bg-(--background) border border-gray-700 rounded-lg shadow-lg p-4 w-[420px] max-w-[95%]"
      tabIndex={-1}
      onClick={e => e.stopPropagation()}
    >
      <button
        className="absolute top-6 right-8 text-gray-400 hover:text-gray-200 text-xl font-bold focus:outline-none"
        style={{ lineHeight: 1 }}
        onClick={onClose}
        aria-label="Close"
        tabIndex={0}
      >
        &times;
      </button>
      {userPrefs && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-400">Model</label>
          <select
            className="flex-1 bg-(--darkelbg) text-white text-sm px-2 py-2 me-14 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={loading}
          >
            {getModelsByProvider(userPrefs.provider as 'openai' | 'claude').map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        className="w-full px-2 py-1 pr-10 rounded border-none focus:outline-none text-base mb-2 resize-none overflow-hidden whitespace-pre-wrap break-words"
        placeholder={t('askQuestion')}
        value={input}
        onChange={e => setInput(e.target.value)}
        ref={inputRef}
        rows={1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void handleSend();
          }
        }}
        disabled={loading}
      />
      {err ? <div className="text-red-400 text-xs mb-2">{err}</div> : null}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Max Tokens</label>
          <input
            type="number"
            min="1"
            max="200000"
            value={maxTokens}
            onChange={e => setMaxTokens(parseInt(e.target.value) || 512)}
            className="w-30 bg-(--darkelbg) text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        <button
          className={`px-3 py-1 rounded text-sm ${loading ? 'opacity-70 cursor-not-allowed' : 'bg-(--emphasis) text-white'}`}
          onClick={() => void handleSend()}
          disabled={loading}
          title="Ctrl/Cmd+Enter"
        >
          {loading ? t('generating') : t('send')}
        </button>
      </div>
    </div>
  );
}
export default function JournalEditor() {
  const _t = useTranslations('Editor');
  const dispatch = useDispatch();
  // Use journalEntries from Redux store
  const entries = useSelector((state: { journalEntries: { entries: JournalEntry[] } }) => state.journalEntries.entries);
  const entriesLoading = useSelector((state: { journalEntries: { loading: boolean } }) => state.journalEntries.loading);
  // Use currentJournalSlice for current, title, content, saveState, preview
  const current = useSelector((state: { currentJournal: { current: JournalEntry | null } }) => state.currentJournal.current);
  const title = useSelector((state: { currentJournal: { title: string } }) => state.currentJournal.title);
  const content = useSelector((state: { currentJournal: { content: string } }) => state.currentJournal.content);
  const saveState = useSelector((state: { currentJournal: { saveState: 'idle' | 'saving' | 'saved' | 'error' } }) => state.currentJournal.saveState);
  const preview = useSelector((state: { currentJournal: { preview: boolean } }) => state.currentJournal.preview);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const announcedBlankRef = useRef(false);

  // Track the latest title/content at the time of save
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef(content);
  const lastSavedTitleRef = useRef(title);
  const lastSavedContentRef = useRef(content);
  const mountedRef = useRef(false);
  // const lastInsertEventRef = useRef<{ text: string; at: number } | null>(null);

  // Vim mode state
  const [vimMode, setVimMode] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  // Dismiss starter inline panel for current blank draft
  const [starterDismissed, setStarterDismissed] = useState(false);
  const [starterVisible, setStarterVisible] = useState(false);
  
  // Seed a blank draft for brand-new users (no entries yet)

  // Validation history state
  const [showHistory, setShowHistory] = useState(false);
  // Publish info bridge: respond with current entry details for modal
  useEffect(() => {
    const onRequestPublishInfo = () => {
      const payload = {
        id: current?.id ?? null,
        title,
        content,
      };
      emitUIEvent('current-entry-response', payload);
    };
    const off = onUIEvent('request-current-entry', () => onRequestPublishInfo());
    return () => off();
  }, [current, title, content]);

  // Announce when a brand-new blank draft is opened so the UI can show template chooser
  useEffect(() => {
    const isBlankDraft = !!current && 
      (title.trim().length === 0 || title.trim().toLowerCase() === 'untitled') && 
      (content.trim().length === 0);
    if (isBlankDraft && !announcedBlankRef.current) {
      emitUIEvent('blank-entry-opened');
      // Also trigger the hello widget for new entries
      emitUIEvent('hello-widget-request');
      setStarterVisible(true);
      announcedBlankRef.current = true;
    }
    if (!current || current.id !== -1) {
      announcedBlankRef.current = false;
    }
  }, [current, title, content]);

  // Additional effect to trigger hello widget when a new draft is created
  useEffect(() => {
    if (current && current.id === -1 && !announcedBlankRef.current) {
      // Small delay to ensure the editor is ready
      const timer = setTimeout(() => {
        emitUIEvent('hello-widget-request');
        setStarterVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [current]);

  // Welcome page: if user has no entries and no current entry, still show hello chooser
  // Wait for entries to finish loading before checking if we should show the starter
  useEffect(() => {
    // Only proceed if loading is complete
    if (entriesLoading) return;
    
    if (!current && entries.length === 0) {
      const isTitleBlank = (title || '').trim().length === 0 || (title || '').trim().toLowerCase() === 'untitled';
      const isContentBlank = (content || '').trim().length === 0;
      if (isTitleBlank && isContentBlank && !announcedBlankRef.current) {
        const timer = setTimeout(() => {
          emitUIEvent('hello-widget-request');
          setStarterVisible(true);
          announcedBlankRef.current = true;
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [current, entries.length, entriesLoading, title, content]);

  // Observe starter close events from the HelloWidget
  useEffect(() => {
    const off = onUIEvent('starter-widget-closed', () => {
      setStarterVisible(false);
      setStarterDismissed(true);
    });
    return () => off();
  }, []);
  
  // Reset starter dismissed state when switching to a new entry
  useEffect(() => {
    if (current?.id === -1) {
      setStarterDismissed(false);
    }
  }, [current?.id]);

  // Framework insertion handler
  const handleFrameworkInsertion = useCallback((event: CustomEvent) => {
    const { framework } = event.detail;
    if (framework && framework.steps) {
      // Create framework template content
      const frameworkContent = `# ${framework.name}\n\n${framework.description}\n\n## Framework Steps\n\n${framework.steps
        .sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
        .map((step: { step_order: number; title: string; description?: string }) => 
          `### Step ${step.step_order}: ${step.title}\n\n${step.description || 'No description provided.'}\n\n---\n\n`
        ).join('')}`;
      
      // Dispatch event to CodeMirror editor to insert at cursor position
      emitUIEvent('insert-text-at-cursor', { text: frameworkContent });
    }
  }, []);

  const createNewEntryWithFramework = useCallback(async (frameworkId: number, content: string, title: string) => {
    console.log('Creating new entry with framework:', { frameworkId, title, content: content.substring(0, 100) + '...' });
    
    // Create new journal entry with framework content
    const draft: JournalEntry = {
      id: -1,
      user_id: -1,
      framework_id: frameworkId,
      title: title,
      content: content
    };
    
    // Add the new entry to the entries list so it appears in FileSystem
    dispatch(setEntries([draft, ...entries]));
    dispatch(setCurrent(draft));
    dispatch(setSaveState('idle'));
    
    console.log('New entry created and set as current');
  }, [dispatch, entries]);

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    dispatch(setSaveState('idle'));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, current, entries]);

  // Add event listener for framework insertion and journal template application
  useEffect(() => {

    const handleDownloadCurrentEntry = () => {
      if (!current || !title || !content) {
        alert('No entry to download');
        return;
      }

      // Create the file content with title and content
      const fileContent = `# ${title}\n\n${content}`;
      
      // Create a blob and download it
      const blob = new Blob([fileContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const offInsertFramework = onUIEvent('insert-framework', ({ framework }) => {
      handleFrameworkInsertion({ detail: { framework } } as CustomEvent);
    });
    const offCreateEntry = onUIEvent('create-entry-with-framework', ({ frameworkId, content, title }) => {
      createNewEntryWithFramework(frameworkId, content, title);
    });
    const offOpenEntry = onUIEvent('open-entry-id', ({ id }) => {
      void (async () => {
        try {
          const res = await fetch(`/api/journal/${id}`, { credentials: 'include' });
          if (res.ok) {
            const entry = await res.json() as JournalEntry;
            if (!entries.find(e => e.id === entry.id)) {
              dispatch(setEntries([entry, ...entries]));
            }
            dispatch(setCurrent(entry));
            dispatch(setSaveState('idle'));
            try {
              const key = `starterShown:${entry.id}`;
              const shown = localStorage.getItem(key);
              const blank = ((entry.title || '').trim().length === 0 || (entry.title || '').trim().toLowerCase() === 'untitled')
                            && (entry.content || '').trim().length === 0;
              if (!shown && blank) {
                emitUIEvent('blank-entry-opened');
              }
              if (!shown) localStorage.setItem(key, '1');
            } catch {}
          }
        } catch {}
      })();
    });
    const offDownload = onUIEvent('download-current-entry', () => handleDownloadCurrentEntry());
    const offReplace = onUIEvent('replace-current-content', ({ text }) => {
      dispatch(setContent(text));
      latestContentRef.current = text;
      // Close starter/lock once template is applied
      setStarterDismissed(true);
      scheduleSave();
    });
    
    return () => {
      offInsertFramework();
      offCreateEntry();
      offOpenEntry();
      offDownload();
      offReplace();
    };
  }, [handleFrameworkInsertion, createNewEntryWithFramework, entries, dispatch, scheduleSave]);

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
    
    // Store current state for potential rollback
    const backupEntry = current;
    
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
        // Update only current entry metadata; do not touch buffer
        dispatch(setCurrentMeta(created));
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
        // Update only current entry metadata; do not touch buffer
        dispatch(setCurrentMeta(updated));
      }
      dispatch(setSaveState('saved'));
      dirtyRef.current = false;
      // Track last saved values to avoid redundant saves
      lastSavedTitleRef.current = latestTitleRef.current;
      lastSavedContentRef.current = latestContentRef.current;
    } catch (error) {
      // Rollback the optimistic update if save failed
      if (backupEntry) {
        dispatch(updateEntry(backupEntry));
      }
      dispatch(setSaveState('error'));
    }
  };

  // Debounced autosave on title/content changes as a safety net
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (title === lastSavedTitleRef.current && content === lastSavedContentRef.current) return;
    dirtyRef.current = true;
    dispatch(setSaveState('idle'));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  });

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

  // Global shortcuts: Alt+V for Vim, Alt+H for History, Alt+P for Preview
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setVimMode(prev => !prev);
      }
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        const goingToPreview = !preview;
        dispatch(setPreview(goingToPreview));
        if (!goingToPreview) {
          // Coming back to editor: request CM focus
          setFocusTick(t => t + 1);
        }
      }
    };
    window.addEventListener('keydown', onGlobalKey, true);
    return () => window.removeEventListener('keydown', onGlobalKey, true);
  }, [dispatch, preview]);

  const isBlankDraft = (
    (!!current &&
      ((title || '').trim().length === 0 || (title || '').trim().toLowerCase() === 'untitled') &&
      ((content || '').trim().length === 0))
    || (!current && entries.length === 0 &&
      ((title || '').trim().length === 0 || (title || '').trim().toLowerCase() === 'untitled') &&
      ((content || '').trim().length === 0))
  );
  const showStarterInline = isBlankDraft && !starterDismissed;
  // Treat starter as active while it's visible regardless of title/content changes
  const isStarterActive = starterVisible && !starterDismissed;

  return (
    <div className="flex flex-col h-full w-full px-6 relative" tabIndex={-1}>
      <div className="flex items-center gap-2 py-4">
        <button
          className={`cursor-pointer px-3 py-1 rounded text-sm flex items-center gap-2
                      ${showHistory
                        ? 'bg-(--emphasis) text-white'
                        : 'bg-(--darkelbg) text-(--foreground)'}`}
          onClick={() => setShowHistory(!showHistory)}
          title="Alt+H"
        >
          <FaHistory className="w-4 h-4" />
          {_t('validationHistory')}
        </button>
        <div className="flex-1" />
        <Saving />
        <button
          className={`cursor-pointer px-3 py-1 rounded text-sm ${vimMode ? 'bg-(--emphasis) text-white' : 'bg-(--darkelbg) text-(--foreground)'}`}
          onClick={() => setVimMode(!vimMode)}
          title="Alt+V"
        >
          {vimMode ? 'Vim On' : 'Vim Off'}
        </button>
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
          const newTitle = e.target.value;
          dispatch(setTitle(newTitle));
          // Update ref immediately so saveNow always gets latest
          latestTitleRef.current = newTitle;
          
          // IMMEDIATELY update the entry in the entries list for instant filesystem visibility
          if (current && current.id !== -1) {
            const updatedEntry = { ...current, title: newTitle };
            dispatch(updateEntry(updatedEntry));
          }
          
          scheduleSave();
        }}
      />

      {showHistory && (
        <div className="mb-4 w-full h-fit">
          <ValidationHistory
            className="w-full h-fit"
            entryId={current?.id}
          />
        </div>
      )}

      <div className={`flex-1 w-full relative ${preview ? 'hidden' : ''}`}>
        {(() => {
          console.log('isBlankDraft components:');
          console.log('- !!current:', !!current);
          console.log('- current.id:', current?.id);
          console.log('- current.id === -1:', current?.id === -1);
          console.log('- title.trim().length === 0:', title.trim().length === 0);
          console.log('- content.trim().length === 0:', content.trim().length === 0);
          console.log('- title:', title);
          console.log('- content:', content);
          // Add console statements for showStarterInline as well
          console.log('- showStarterInline:', showStarterInline);
          return false;
        })()}
        {(!content || content.trim().length === 0) && !isStarterActive && (
          <div className="pointer-events-none absolute top-2 left-4 text-(--secondary) text-md opacity-60 select-none">
            {_t('startWriting')}
          </div>
        )}
        <CMEditor
          value={content}
          onChange={val => {
            dispatch(setContent(val));
            latestContentRef.current = val;
            scheduleSave();
          }}
          editable={true}
          vimEnabled={vimMode}
          locked={showStarterInline}
          onUnlock={() => setStarterDismissed(true)}
          focusTick={focusTick}
          t={_t}
        />
      </div>
      {preview && (
        <div className="flex-1 w-full rounded bg-transparent">
          <MarkdownPreview content={content} />
        </div>
      )}
    </div>
  );
}