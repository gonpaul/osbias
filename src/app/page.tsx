'use client';

import { useState, useEffect, Suspense } from 'react';
import { emitUIEvent, onUIEvent } from '@/lib/uiEvents';
import Image from "next/image";
import FileSystem from "@/components/editor/FileSystem";
import { CgTemplate } from 'react-icons/cg';
import { GrValidate } from "react-icons/gr";
import { FiDownload } from "react-icons/fi";
import { FaRegKeyboard } from "react-icons/fa";
import RightBar from "@/components/editor/RightBar";
import JournalEditor from "@/components/editor/JournalEditor";
import FrameworkTemplatePopup from "@/components/editor/FrameworkTemplatePopup";
import PublishModal from "@/components/feed/PublishModal";
import QuickMakeTemplateModal from "@/components/editor/QuickMakeTemplateModal";
import JournalTemplatesModal from "@/components/editor/JournalTemplatesModal";
import NewTemplateChooserModal from "@/components/editor/NewTemplateChooserModal";


export default function Home() {
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isQuickMakeTemplateOpen, setIsQuickMakeTemplateOpen] = useState(false);
  const [isJournalTemplatesOpen, setIsJournalTemplatesOpen] = useState(false);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [publishData, setPublishData] = useState<{ id: number | null; title: string; content: string }>({ id: null, title: '', content: '' });
  const [allowPosting, setAllowPosting] = useState<boolean | null>(null);
  // read search params via window to avoid suspense requirement
  // type CurrentEntryDetail is now provided by uiEvents payload typing

  // Open modals in response to global events dispatched by the editor widget
  useEffect(() => {
    const off1 = onUIEvent('open-journal-templates', () => { setIsJournalTemplatesOpen(true); });
    const off2 = onUIEvent('open-framework-templates', () => setIsTemplatePopupOpen(true));
    const off3 = onUIEvent('open-template-chooser', () => setIsChooserOpen(true));
    return () => { off1(); off2(); off3(); };
  }, []);

  const handleTemplateClick = () => {
    // Open chooser first to select between journal template / framework / continue
    setIsChooserOpen(true);
  };

  // Fetch permission to control publishing
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) { setAllowPosting(null); return; }
        const me = await res.json();
        setAllowPosting(Boolean(me.allow_posting));
      } catch {
        setAllowPosting(null);
      }
    })();
  }, []);

  const handleDownload = () => {
    // Dispatch custom event to trigger download
    emitUIEvent('download-current-entry');
  };

  // Handle framework from URL parameters
  useEffect(() => {
    const url = new URL(window.location.href);
    const frameworkId = url.searchParams.get('framework');
    const content = url.searchParams.get('content');
    
    if (frameworkId && content) {
      (async () => {
        try {
          // Create new journal entry on the server so it belongs to the current user
          const decodedContent = decodeURIComponent(content);
          const frameworkName = decodedContent.split('\n')[0].replace('# ', '');

          const res = await fetch('/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              framework_id: parseInt(frameworkId),
              title: frameworkName,
              content: decodedContent,
            })
          });

          if (res.ok) {
            const created = await res.json();
            // Ask editor to open this entry specifically
            emitUIEvent('open-entry-id', { id: created.id });
          }
        } catch {
          // noop; editor will still load normally
        } finally {
          // Clean up URL parameters regardless
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('framework');
          cleanUrl.searchParams.delete('content');
          window.history.replaceState({}, '', cleanUrl.toString());
        }
      })();
    }
  }, []);

  // When a brand-new entry is created (id === -1), prompt for template chooser automatically


  const handleSelectFramework = async (framework: { id: number; name: string; description: string; steps?: { step_order: number; title: string; description?: string }[] }) => {
    console.log('Selected framework:', framework);
    
    // Fetch framework steps if not already loaded
    if (!framework.steps) {
      try {
        const response = await fetch(`/api/frameworks/${framework.id}/steps`, {
          credentials: 'include',
        });
        if (response.ok) {
          const steps = await response.json();
          framework.steps = steps;
        }
      } catch (error) {
        console.error('Error fetching framework steps:', error);
      }
    }
    
    // Track framework usage (selection from template popup)
    try {
      await fetch(`/api/frameworks/${framework.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notes: `Applied via template popup: ${framework.name}`,
          completed: false,
        }),
      });
    } catch {
      // non-blocking
    }
    
    // Dispatch event with framework data to JournalEditor
    emitUIEvent('insert-framework', { framework });
  };

  return (
    <Suspense fallback={<div />}> 
    {/* <div className="font-sans grid grid-rows-[1fr_20px] items-center justify-items-center min-h-screen me-8 py-10"> */}
    <div className="font-sans max-h-screen overflow-y-auto pt-10">
      <main
        className="grid grid-cols-[280px_1fr_340px] h-full w-full rounded-t-2xl items-start"
      >
        <FileSystem width="mx-auto w-120"></FileSystem>
        <div id="editor-div" className="flex flex-col bg-(--darkelbg) h-full rounded-t-2xl w-full">
          <div className="flex flex-row rounded-3xl items-center-safe my-4 py-6 px-10 w-full sticky -top-0 z-20 bg-(--darkelbg) bg-opacity-90 backdrop-blur-sm shadow-[16px_8px_24px_4px_rgba(0,0,0,0.11)]">
            <div className="flex-1 ps-24 flex items-center">
              <button
                className="cursor-pointer me-4 px-6 py-2 rounded-2xl bg-(--secondary)/20 hover:bg-(--dark) hover:opacity-80 transition-colors duration-300"
                title="Make a template"
                onClick={() => setIsQuickMakeTemplateOpen(true)}
              >
                Make a template
              </button>
            </div>
            <ul className="flex flex-row rounded-xl bg-(--secondary)/20 overflow-hidden border-1 border-(--secondary) flex-shrink-0 divide-x divide-(--secondary)">
            <button
              onClick={handleTemplateClick}
              className="cursor-pointer pe-4 py-2 rounded-s-md bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors first:pl-10"
              title="Templates"
            >
              <CgTemplate className="h-full w-10"/>
            </button>
            <button
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Validate"
              onClick={() => {
                // Dispatch custom event to trigger idea validation
                emitUIEvent('idea-validation-request');
              }}
            >
              <GrValidate className="h-full w-10"/>
            </button>
            <button 
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Bias Check"
              onClick={() => {
                // Dispatch custom event to trigger bias checking
                emitUIEvent('bias-check-request');
              }}
            >
              Bias-check 
            </button>
            <button 
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Paraphrase"
              onClick={() => {
                // This will be handled by the JournalEditor component
                emitUIEvent('paraphrase-request');
              }}
            >
              Paraphrase
            </button>
            <button 
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors rounded-e-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={allowPosting === false}
              title={allowPosting === false ? 'Posting not allowed' : undefined}
              onClick={() => {
                  const off = onUIEvent('current-entry-response', (detail) => {
                    setPublishData(detail);
                    setIsPublishOpen(true);
                    off();
                  });
                  emitUIEvent('request-current-entry');
                }}
              >
                Publish
              </button>
            </ul>
            <div className="flex-1 flex justify-end pe-20">
              <button 
                className="cursor-pointer p-4 bg-(--secondary)/20 hover:bg-(--dark) transition-colors duration-300 text-center rounded-full"
                title="Download"
                onClick={handleDownload}
              >
                <FiDownload className="h-full w-10 hover:opacity-80 transition-opacity duration-300"/>
              </button>
            </div>
          </div>
          <div className="flex-1 w-4/5 2xl:w-400 pb-20 mx-auto flex flex-col items-start min-h-screen">
            <JournalEditor />
            {/* <TemplateControls /> */}
          </div>
        </div>

        <RightBar />
      </main>


      {/* Shortcuts Help Floating Button */}
      <button
        className="fixed bottom-4 right-8 z-40 p-3 rounded-full bg-(--darkelbg) border border-(--secondary)/30 text-(--foreground) shadow hover:border-(--golden)/50 hover:shadow-lg transition-colors duration-300 cursor-pointer"
        title="Shortcuts (Ctrl+/)"
        onClick={() => emitUIEvent('toggle-shortcuts-help')}
      >
        <FaRegKeyboard className="w-6 h-6" />
      </button>

      {/* Framework Template Popup */}
      <FrameworkTemplatePopup
        isOpen={isTemplatePopupOpen}
        onClose={() => setIsTemplatePopupOpen(false)}
        onSelectFramework={handleSelectFramework}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        entryId={publishData.id}
        initialTitle={publishData.title}
        content={publishData.content}
        onPublished={(slug) => {
          const url = `${window.location.origin}/p/${slug}`;
          try { navigator.clipboard.writeText(url); } catch {}
        }}
      />

      <QuickMakeTemplateModal
        isOpen={isQuickMakeTemplateOpen}
        onClose={() => setIsQuickMakeTemplateOpen(false)}
      />

      {/* Template Chooser */}
      <NewTemplateChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        onChooseJournalTemplate={() => {
          setIsChooserOpen(false);
          setIsJournalTemplatesOpen(true);
        }}
        onChooseFrameworkTemplate={() => {
          setIsChooserOpen(false);
          setIsTemplatePopupOpen(true);
        }}
      />

      {/* Journal Templates Modal */}
      <JournalTemplatesModal
        isOpen={isJournalTemplatesOpen}
        onClose={() => { setIsJournalTemplatesOpen(false); }}
      />

      <footer className="hidden gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
    </Suspense>
  );
}
