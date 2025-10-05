'use client';

import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface NewTemplateChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseJournalTemplate: () => void;
  onChooseFrameworkTemplate: () => void;
}

export default function NewTemplateChooserModal({ 
  isOpen, 
  onClose, 
  onChooseJournalTemplate, 
  onChooseFrameworkTemplate 
}: NewTemplateChooserModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-(--background) border border-(--secondary)/30 rounded-xl p-8 w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Pick a template</h3>
          <button
            onClick={onClose}
            className="text-(--secondary) hover:text-(--foreground) transition-colors duration-300 cursor-pointer"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-gray-300 text-center text-lg">
            Choose a saved journal template or apply a thinking framework. You can also continue with a blank page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Journal Templates Card */}
            <button
              onClick={() => {
                onChooseJournalTemplate();
                onClose();
              }}
              className="cursor-pointer rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 bg-(--background) p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="text-center">
                <div className="text-2xl mb-3">📝</div>
                <div className="text-lg font-semibold text-white mb-2">Journal Template</div>
                <div className="text-sm text-gray-400">
                  Start with a pre-made journal template with prompts and structure
                </div>
              </div>
            </button>

            {/* Framework Templates Card */}
            <button
              onClick={() => {
                onChooseFrameworkTemplate();
                onClose();
              }}
              className="cursor-pointer rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 bg-(--background) p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="text-center">
                <div className="text-2xl mb-3">🧠</div>
                <div className="text-lg font-semibold text-white mb-2">Framework Template</div>
                <div className="text-sm text-gray-400">
                  Apply a thinking framework with structured steps and methodology
                </div>
              </div>
            </button>
          </div>
{/* 
          <div className="flex gap-2 justify-center">
            <button
              className="px-4 py-2 rounded bg-(--darkelbg) text-(--foreground) text-sm hover:opacity-80 border border-(--secondary)/30"
              onClick={() => {
                onClose();
              }}
            >
              Continue Blank
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
