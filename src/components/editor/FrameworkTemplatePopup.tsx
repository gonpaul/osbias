'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FaSearch, FaEye, FaClock, FaTag, FaTimes } from 'react-icons/fa';
import { BiSolidPyramid } from 'react-icons/bi';

interface Framework {
  id: number;
  name: string;
  description: string;
  concepts: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
  steps?: FrameworkStep[];
  usage_stats?: {
    total_uses: number;
    unique_users: number;
    completion_rate: number;
    avg_rating: number;
  };
}

interface FrameworkStep {
  id: number;
  framework_id: number;
  step_order: number;
  title: string;
  description: string;
}

interface FrameworkTemplatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFramework: (framework: Framework) => void;
}

export default function FrameworkTemplatePopup({ 
  isOpen, 
  onClose, 
  onSelectFramework 
}: FrameworkTemplatePopupProps) {
  const t = useTranslations('Editor');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  // Fetch frameworks when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchFrameworks();
    }
  }, [isOpen]);

  // Filter frameworks based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = frameworks.filter(framework =>
        framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        framework.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFrameworks(filtered);
    } else {
      setFilteredFrameworks(frameworks);
    }
  }, [frameworks, searchTerm]);

  const fetchFrameworks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/frameworks', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFrameworks(data);
        setFilteredFrameworks(data);
      }
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (framework: Framework) => {
    try {
      const response = await fetch(`/api/frameworks/${framework.id}/steps`, {
        credentials: 'include',
      });
      if (response.ok) {
        const steps = await response.json();
        setSelectedFramework({ ...framework, steps });
      } else {
        setSelectedFramework(framework);
      }
    } catch (error) {
      console.error('Error fetching framework steps:', error);
      setSelectedFramework(framework);
    }
  };

  const handleSelectFramework = (framework: Framework) => {
    onSelectFramework(framework);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Popup */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-(--darkelbg) rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-(--secondary)/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-(--foreground) flex items-center gap-3">
                  <BiSolidPyramid className="text-(--golden)" />
                  {t('chooseFramework')}
                </h2>
                <p className="text-(--secondary) mt-2">
                  {t('chooseFrameworkDesc')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-(--secondary) hover:text-(--foreground) text-2xl transition-colors duration-300 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-(--secondary)" />
                <input
                  type="text"
                  placeholder={t('searchFrameworks')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-4 py-3 bg-(--background) border border-(--secondary)/30 rounded-lg text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-(--foreground) text-lg">{t('loadingFrameworks')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFrameworks.map((framework) => (
                  <div
                    key={framework.id}
                    className="bg-(--background) rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 transition-all duration-300 hover:shadow-lg hover:shadow-(--golden)/10 group h-120"
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Framework Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-(--foreground) group-hover:text-(--golden) transition-colors">
                            {framework.name}
                          </h3>
                          {framework.is_system && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-(--golden)/20 text-(--golden) rounded-full">
                              {t('systemFramework')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-(--secondary) text-sm mb-3 line-clamp-2 flex-1">
                        {framework.description}
                      </p>

                      {/* Concepts/Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {framework.concepts.slice(0, 2).map((concept, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-(--emphasis)/20 text-(--emphasis-light) rounded-full"
                          >
                            {concept}
                          </span>
                        ))}
                        {framework.concepts.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-(--secondary)/20 text-(--secondary) rounded-full">
                            +{framework.concepts.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectFramework(framework)}
                          className="flex-1 bg-(--emphasis) hover:bg-(--emphasis)/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {t('useTemplate')}
                        </button>
                        <button
                          onClick={() => handleViewDetails(framework)}
                          className="px-4 py-2 border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) rounded-lg text-sm transition-colors duration-300 cursor-pointer"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredFrameworks.length === 0 && (
              <div className="text-center py-12">
                <BiSolidPyramid className="mx-auto text-6xl text-(--secondary)/50 mb-4" />
                <h3 className="text-xl font-semibold text-(--foreground) mb-2">
                  {t('noFrameworksFound')}
                </h3>
                <p className="text-(--secondary)">
                  {t('tryAdjustSearch')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Framework Details Modal */}
      {selectedFramework && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-(--darkelbg) rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-(--foreground) mb-2">
                    {selectedFramework.name}
                  </h2>
                  {selectedFramework.is_system && (
                    <span className="inline-block px-3 py-1 text-sm bg-(--golden)/20 text-(--golden) rounded-full">
                      {t('systemFramework')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFramework(null)}
                  className="absolute top-2 right-4 text-(--secondary) hover:text-(--foreground) text-2xl ml-4 transition-colors duration-300 cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              {/* Description */}
              <p className="text-(--secondary) mb-6 text-lg">
                {selectedFramework.description}
              </p>

              {/* Concepts */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-(--foreground) mb-3 flex items-center gap-2">
                  <FaTag />
                  {t('keyConcepts')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFramework.concepts.map((concept, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-(--emphasis)/20 text-(--emphasis-light) rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Framework Steps */}
              {selectedFramework.steps && selectedFramework.steps.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-(--foreground) mb-4 flex items-center gap-2">
                    <FaClock />
                    {t('frameworkSteps')} ({selectedFramework.steps.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedFramework.steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="bg-(--background) rounded-lg p-4 border border-(--secondary)/20 hover:border-(--golden)/30 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-(--golden) text-(--background) rounded-full flex items-center justify-center text-sm font-bold">
                              {step.step_order}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-(--foreground) mb-2">
                                {step.title}
                              </h4>
                              {step.description && (
                                <p className="text-(--secondary) text-sm">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-(--secondary)/30">
                <button
                  onClick={() => handleSelectFramework(selectedFramework)}
                  className="flex-1 bg-(--emphasis) hover:bg-(--emphasis)/80 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaEye />
                  {t('useThisFramework')}
                </button>
                <button
                  onClick={() => setSelectedFramework(null)}
                  className="px-6 py-3 border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) rounded-lg transition-colors duration-300 cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
