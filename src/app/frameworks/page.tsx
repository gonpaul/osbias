'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaEye, FaClock, FaTag, FaEdit, FaTrash } from 'react-icons/fa';
import { BiSolidPyramid } from 'react-icons/bi';
import CreateFrameworkModal from '@/components/frameworks/CreateFrameworkModal';
import EditFrameworkModal from '@/components/frameworks/EditFrameworkModal';

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

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [frameworkToEdit, setFrameworkToEdit] = useState<Framework | null>(null);

  // Fetch frameworks on component mount
  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        const response = await fetch('/api/frameworks', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          
          // Fetch usage stats for each framework
          const frameworksWithStats = await Promise.all(
            data.map(async (framework: Framework) => {
              try {
                const statsResponse = await fetch(`/api/frameworks/${framework.id}/stats`, {
                  credentials: 'include',
                });
                if (statsResponse.ok) {
                  const stats = await statsResponse.json();
                  return { ...framework, usage_stats: stats };
                }
              } catch (error) {
                console.error(`Error fetching stats for framework ${framework.id}:`, error);
              }
              return framework;
            })
          );
          
          setFrameworks(frameworksWithStats);
          setFilteredFrameworks(frameworksWithStats);
        }
      } catch (error) {
        console.error('Error fetching frameworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFrameworks();
  }, []);

  // Filter frameworks based on search and filters
  useEffect(() => {
    let filtered = frameworks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(framework =>
        framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        framework.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Concept filter
    if (selectedConcept) {
      filtered = filtered.filter(framework =>
        framework.concepts.includes(selectedConcept)
      );
    }

    // System frameworks filter
    if (showSystemOnly) {
      filtered = filtered.filter(framework => framework.is_system);
    }

    setFilteredFrameworks(filtered);
  }, [frameworks, searchTerm, selectedConcept, showSystemOnly]);

  // Get all unique concepts for filter dropdown
  const allConcepts = Array.from(
    new Set(frameworks.flatMap(f => f.concepts))
  ).sort();

  const handleUseFramework = async (framework: Framework) => {
    try {
      // Track framework usage
      await fetch(`/api/frameworks/${framework.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notes: `Applied framework: ${framework.name}`,
          completed: false, // Will be updated when user completes the framework
        }),
      });

      // Fetch framework steps if not already loaded
      let steps = framework.steps;
      if (!steps) {
        try {
          const response = await fetch(`/api/frameworks/${framework.id}/steps`, {
            credentials: 'include',
          });
          if (response.ok) {
            steps = await response.json();
          }
        } catch (error) {
          console.error('Error fetching framework steps:', error);
        }
      }

      // Create framework content
      const frameworkContent = steps && steps.length > 0 
        ? `# ${framework.name}\n\n${framework.description}\n\n## Framework Steps\n\n${steps
            .sort((a, b) => a.step_order - b.step_order)
            .map((step) => 
              `### Step ${step.step_order}: ${step.title}\n\n${step.description || 'No description provided.'}\n\n---\n\n`
            ).join('')}`
        : `# ${framework.name}\n\n${framework.description}\n\n*Framework steps will be loaded when you start editing.*`;

      // Redirect to editor with framework content
      window.location.href = `/?framework=${framework.id}&content=${encodeURIComponent(frameworkContent)}`;
    } catch (error) {
      console.error('Error using framework:', error);
      // Still redirect even if tracking fails
      window.location.href = `/?framework=${framework.id}`;
    }
  };

  const handleViewDetails = async (framework: Framework) => {
    try {
      // Fetch framework steps
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

  const handleCreateFramework = () => {
    setShowCreateModal(true);
  };

  const handleEditFramework = async (framework: Framework) => {
    try {
      // Fetch framework steps
      const response = await fetch(`/api/frameworks/${framework.id}/steps`, {
        credentials: 'include',
      });
      if (response.ok) {
        const steps = await response.json();
        setFrameworkToEdit({ ...framework, steps });
      } else {
        setFrameworkToEdit(framework);
      }
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching framework steps:', error);
      setFrameworkToEdit(framework);
      setShowEditModal(true);
    }
  };

  const handleDeleteFramework = async (framework: Framework) => {
    if (!confirm(`Are you sure you want to delete "${framework.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/frameworks/${framework.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh frameworks list
        const fetchFrameworks = async () => {
          try {
            const response = await fetch('/api/frameworks', {
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              
              // Fetch usage stats for each framework
              const frameworksWithStats = await Promise.all(
                data.map(async (framework: Framework) => {
                  try {
                    const statsResponse = await fetch(`/api/frameworks/${framework.id}/stats`, {
                      credentials: 'include',
                    });
                    if (statsResponse.ok) {
                      const stats = await statsResponse.json();
                      return { ...framework, usage_stats: stats };
                    }
                  } catch (error) {
                    console.error(`Error fetching stats for framework ${framework.id}:`, error);
                  }
                  return framework;
                })
              );
              
              setFrameworks(frameworksWithStats);
              setFilteredFrameworks(frameworksWithStats);
            }
          } catch (error) {
            console.error('Error fetching frameworks:', error);
          }
        };

        fetchFrameworks();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete framework');
      }
    } catch (error) {
      console.error('Error deleting framework:', error);
      alert('An error occurred while deleting the framework');
    }
  };

  const handleFrameworkSuccess = () => {
    console.log('Framework creation successful, refreshing list...');
    // Refresh frameworks list
    const fetchFrameworks = async () => {
      try {
        console.log('Fetching frameworks...');
        const response = await fetch('/api/frameworks', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched frameworks:', data);
          
          // Fetch usage stats for each framework
          const frameworksWithStats = await Promise.all(
            data.map(async (framework: Framework) => {
              try {
                const statsResponse = await fetch(`/api/frameworks/${framework.id}/stats`, {
                  credentials: 'include',
                });
                if (statsResponse.ok) {
                  const stats = await statsResponse.json();
                  return { ...framework, usage_stats: stats };
                }
              } catch (error) {
                console.error(`Error fetching stats for framework ${framework.id}:`, error);
              }
              return framework;
            })
          );
          
          console.log('Updated frameworks with stats:', frameworksWithStats);
          setFrameworks(frameworksWithStats);
          setFilteredFrameworks(frameworksWithStats);
        } else {
          console.error('Failed to fetch frameworks:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching frameworks:', error);
      }
    };

    fetchFrameworks();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background) flex items-center justify-center">
        <div className="text-(--foreground) text-lg">Loading frameworks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      {/* Header */}
      <div className="bg-(--darkelbg) border-b border-(--secondary)/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-(--foreground) flex items-center gap-3">
                <BiSolidPyramid className="text-(--golden)" />
                Frameworks Library
              </h1>
              <p className="text-(--secondary) mt-2">
                Discover and apply thinking frameworks to structure your thoughts
              </p>
            </div>
            <button 
              onClick={handleCreateFramework}
              className="bg-(--emphasis) hover:bg-(--emphasis)/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-300 cursor-pointer"
            >
              <FaPlus />
              Create Framework
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-(--darkelbg) rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-(--secondary)" />
              <input
                type="text"
                placeholder="Search frameworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-3 bg-(--background) border border-(--secondary)/30 rounded-lg text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
              />
            </div>

            {/* Concept Filter */}
            <select
              value={selectedConcept}
              onChange={(e) => setSelectedConcept(e.target.value)}
              className="px-6 py-3 bg-(--background) border border-(--secondary)/30 rounded-lg text-(--foreground) focus:outline-none focus:border-(--golden)"
            >
              <option value="">All Concepts</option>
              {allConcepts.map(concept => (
                <option key={concept} value={concept}>{concept}</option>
              ))}
            </select>

            {/* System Only Filter */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showSystemOnly}
                onChange={(e) => setShowSystemOnly(e.target.checked)}
                className="w-8 h-8 text-(--golden) bg-(--background) border-(--secondary)/30 rounded focus:ring-(--golden)"
              />
              <span className="text-(--foreground)">System frameworks only</span>
            </label>

            {/* Results Count */}
            <div className="flex items-center text-(--secondary)">
              <span>{filteredFrameworks.length} frameworks found</span>
            </div>
          </div>
        </div>

        {/* Frameworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFrameworks.map((framework) => (
            <div
              key={framework.id}
              className="bg-(--darkelbg) rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 transition-all duration-300 hover:shadow-lg hover:shadow-(--golden)/10 group h-full"
            >
              <div className="p-6 flex flex-col h-full">
                {/* Framework Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-(--foreground) group-hover:text-(--golden) transition-colors">
                      {framework.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {framework.is_system ? (
                        <span className="inline-block px-4 py-1 text-xs bg-(--golden)/20 text-(--golden) rounded-full">
                          System Framework
                        </span>
                      ) : (
                        <span className="inline-block px-4 py-1 text-xs bg-gray-100 text-(--background) rounded-full">
                          Custom Framework
                        </span>
                      )}
                    </div>
                  </div>
                  {!framework.is_system && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditFramework(framework)}
                        className="p-2 text-(--secondary) hover:text-(--golden) transition-colors duration-300 cursor-pointer"
                        title="Edit framework"
                      >
                        <FaEdit className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleDeleteFramework(framework)}
                        className="p-2 text-(--secondary) hover:text-red-500 transition-colors duration-300 cursor-pointer"
                        title="Delete framework"
                      >
                        <FaTrash className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-(--secondary) flex-1 text-sm mb-4 line-clamp-3">
                  {framework.description}
                </p>

                {/* Concepts/Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {framework.concepts.slice(0, 3).map((concept, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-(--emphasis)/20 text-(--emphasis-light) rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                  {framework.concepts.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-(--secondary)/20 text-(--secondary) rounded-full">
                      +{framework.concepts.length - 3} more
                    </span>
                  )}
                </div>

                {/* Usage Statistics */}
                {framework.usage_stats && (
                  <div className="flex flex-wrap justify-between items-center gap-6 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-(--secondary)">Uses:</span>
                      <span className="text-(--foreground) font-medium">
                        {framework.usage_stats.total_uses}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-(--secondary)">Rating:</span>
                      <span className="text-(--foreground) font-medium">
                        {framework.usage_stats.avg_rating > 0 
                          ? `${framework.usage_stats.avg_rating.toFixed(1)}/5` 
                          : 'No ratings'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseFramework(framework)}
                    className="flex-1 bg-(--emphasis) hover:bg-(--emphasis)/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    Use Framework
                  </button>
                  <button
                    onClick={() => handleViewDetails(framework)}
                    className="px-4 py-2 border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) rounded-lg text-sm transition-colors duration-300 cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredFrameworks.length === 0 && (
          <div className="text-center py-12">
            <BiSolidPyramid className="mx-auto text-6xl text-(--secondary)/50 mb-4" />
            <h3 className="text-xl font-semibold text-(--foreground) mb-2">
              No frameworks found
            </h3>
            <p className="text-(--secondary)">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
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
                      System Framework
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
                  Key Concepts
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
                    Framework Steps ({selectedFramework.steps.length})
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
                  onClick={() => handleUseFramework(selectedFramework)}
                  className="flex-1 bg-(--emphasis) hover:bg-(--emphasis)/80 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaEye />
                  Use This Framework
                </button>
                <button
                  onClick={() => setSelectedFramework(null)}
                  className="px-6 py-3 border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) rounded-lg transition-colors duration-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Framework Modal */}
      <CreateFrameworkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFrameworkSuccess}
      />

      {/* Edit Framework Modal */}
      <EditFrameworkModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFrameworkToEdit(null);
        }}
        onSuccess={handleFrameworkSuccess}
        framework={frameworkToEdit}
      />
    </div>
  );
}
