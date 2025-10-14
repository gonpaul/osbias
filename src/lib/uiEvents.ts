// Centralized UI event bus: typed names, emit/listen helpers

export type UIEventName =
  | 'open-journal-templates'
  | 'open-framework-templates'
  | 'hello-widget-request'
  | 'blank-entry-opened'
  | 'request-current-entry'
  | 'current-entry-response'
  | 'insert-text-at-cursor'
  | 'replace-current-content'
  | 'insert-framework'
  | 'create-entry-with-framework'
  | 'open-entry-id'
  | 'download-current-entry'
  | 'idea-validation-request'
  | 'bias-check-request'
  | 'paraphrase-request'
  | 'open-template-chooser'
  | 'toggle-shortcuts-help';

// Map event names to their payload types
type FrameworkLite = {
  name: string;
  description: string;
  steps?: { step_order: number; title: string; description?: string }[];
};

type PayloadMap = {
  'open-journal-templates': undefined;
  'open-framework-templates': undefined;
  'hello-widget-request': undefined;
  'blank-entry-opened': undefined;
  'request-current-entry': undefined;
  'current-entry-response': { id: number | null; title: string; content: string };
  'insert-text-at-cursor': { text: string };
  'replace-current-content': { text: string };
  'insert-framework': { framework: FrameworkLite };
  'create-entry-with-framework': { frameworkId: number; content: string; title: string };
  'open-entry-id': { id: number };
  'download-current-entry': undefined;
  'idea-validation-request': undefined;
  'bias-check-request': undefined;
  'paraphrase-request': undefined;
  'open-template-chooser': undefined;
  'toggle-shortcuts-help': undefined;
};

export function emitUIEvent<N extends UIEventName>(name: N, detail?: PayloadMap[N]) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[UIEvent emit]', name, detail);
  }
  window.dispatchEvent(new CustomEvent(name, { detail } as CustomEventInit));
}

export function onUIEvent<N extends UIEventName>(
  name: N,
  handler: (detail: PayloadMap[N]) => void
) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const listener = (e: Event) => {
    const ce = e as CustomEvent<PayloadMap[N]>;
    handler(ce.detail as PayloadMap[N]);
  };
  window.addEventListener(name, listener as EventListener);
  return () => window.removeEventListener(name, listener as EventListener);
}

// Helper to request/await a single response event once
export function onceUIEvent<N extends UIEventName>(name: N): Promise<PayloadMap[N]> {
  return new Promise((resolve) => {
    const off = onUIEvent(name, (detail) => {
      off();
      resolve(detail);
    });
  });
}

export type UIEventPayload<N extends UIEventName> = PayloadMap[N];


