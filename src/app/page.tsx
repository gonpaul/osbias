'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from "next/image";
import FileSystem from "@/components/editor/FileSystem";
import { CgTemplate } from 'react-icons/cg';
import { GrValidate } from "react-icons/gr";
import { FiDownload } from "react-icons/fi";
import RightBar from "@/components/editor/RightBar";
import JournalEditor from "@/components/editor/JournalEditor";
import FrameworkTemplatePopup from "@/components/editor/FrameworkTemplatePopup";
import PublishModal from "@/components/feed/PublishModal";
import QuickMakeTemplateModal from "@/components/editor/QuickMakeTemplateModal";
import JournalTemplatesModal from "@/components/editor/JournalTemplatesModal";
import NewEntryChooserModal from "@/components/editor/NewEntryChooserModal";


export default function Home() {
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isQuickMakeTemplateOpen, setIsQuickMakeTemplateOpen] = useState(false);
  const [isJournalTemplatesOpen, setIsJournalTemplatesOpen] = useState(false);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [publishData, setPublishData] = useState<{ id: number | null; title: string; content: string }>({ id: null, title: '', content: '' });
  const searchParams = useSearchParams();
  type CurrentEntryDetail = { id: number | null; title: string; content: string };

  // Open modals in response to global events dispatched by the editor widget
  useEffect(() => {
    const openJournalTemplates = () => setIsJournalTemplatesOpen(true);
    const openFrameworkTemplates = () => setIsTemplatePopupOpen(true);

    window.addEventListener('open-journal-templates', openJournalTemplates);
    window.addEventListener('open-framework-templates', openFrameworkTemplates);

    return () => {
      window.removeEventListener('open-journal-templates', openJournalTemplates);
      window.removeEventListener('open-framework-templates', openFrameworkTemplates);
    };
  }, []);

  const handleTemplateClick = () => {
    // Open chooser first to select between journal template / framework / continue
    setIsChooserOpen(true);
  };

  const handleDownload = () => {
    // Dispatch custom event to trigger download
    window.dispatchEvent(new CustomEvent('download-current-entry'));
  };

  // Handle framework from URL parameters
  useEffect(() => {
    const frameworkId = searchParams.get('framework');
    const content = searchParams.get('content');
    
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
            window.dispatchEvent(new CustomEvent('open-entry-id', { detail: { id: created.id } }));
          }
        } catch {
          // noop; editor will still load normally
        } finally {
          // Clean up URL parameters regardless
          const url = new URL(window.location.href);
          url.searchParams.delete('framework');
          url.searchParams.delete('content');
          window.history.replaceState({}, '', url.toString());
        }
      })();
    }
  }, [searchParams]);

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
    window.dispatchEvent(new CustomEvent('insert-framework', { 
      detail: { framework } 
    }));
  };

  return (
    // <div className="font-sans grid grid-rows-[1fr_20px] items-center justify-items-center min-h-screen me-8 py-10">
    <div className="font-sans max-h-screen overflow-y-auto pt-10">
      <main
        className="grid grid-cols-[280px_1fr_340px] h-full w-full rounded-t-2xl items-start"
      >
        <FileSystem width="mx-auto w-120"></FileSystem>
        <div className="flex flex-col bg-(--darkelbg) h-full rounded-t-2xl w-full">
          <div className="flex flex-row items-center-safe my-10 w-full">
            <div className="flex-1 ps-24 flex items-center">
              <button
                className="cursor-pointer me-4 px-3 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors duration-300"
                title="Make a template"
                onClick={() => setIsQuickMakeTemplateOpen(true)}
              >
                Make a template
              </button>
            </div>
            <ul className="flex flex-row rounded-md border-1 border-(--secondary) flex-shrink-0 divide-x divide-(--secondary)">
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
                window.dispatchEvent(new CustomEvent('idea-validation-request'));
              }}
            >
              <GrValidate className="h-full w-10"/>
            </button>
            <button 
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Bias Check"
              onClick={() => {
                // Dispatch custom event to trigger bias checking
                window.dispatchEvent(new CustomEvent('bias-check-request'));
              }}
            >
              Bias-check 
            </button>
            <button 
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Paraphrase"
              onClick={() => {
                // This will be handled by the JournalEditor component
                window.dispatchEvent(new CustomEvent('paraphrase-request'));
              }}
            >
              Paraphrase
            </button>
              <button 
                className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors rounded-e-md"
                onClick={() => {
                  const handler = (e: Event) => {
                    const ce = e as CustomEvent<CurrentEntryDetail>;
                    setPublishData(ce.detail);
                    setIsPublishOpen(true);
                    window.removeEventListener('current-entry-response', handler);
                  };
                  window.addEventListener('current-entry-response', handler);
                  window.dispatchEvent(new CustomEvent('request-current-entry'));
                }}
              >
                Publish
              </button>
            </ul>
            <div className="flex-1 flex justify-end pe-20">
              <button 
                className="cursor-pointer ps-4 pe-4 py-2 rounded bg-transparent"
                title="Download"
                onClick={handleDownload}
              >
                <FiDownload className="h-full w-10 hover:opacity-80 transition-opacity duration-300"/>
              </button>
            </div>
          </div>
          <div className="flex-1 w-4/5 2xl:w-400 mx-auto flex flex-col items-start min-h-screen">
            <JournalEditor />
            {/* <TemplateControls /> */}
          </div>
        </div>

        <RightBar />
      </main>


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
      <NewEntryChooserModal
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
        onClose={() => setIsJournalTemplatesOpen(false)}
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
  );
}
