'use client';

import { useState } from 'react';
import { FaTimes, FaPlus, FaTrash, FaGripVertical } from 'react-icons/fa';

interface FrameworkStep {
  id?: number;
  step_order: number;
  title: string;
  description: string;
}

interface CreateFrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFrameworkModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateFrameworkModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [concepts, setConcepts] = useState<string[]>([]);
  const [newConcept, setNewConcept] = useState('');
  const [steps, setSteps] = useState<FrameworkStep[]>([
    { step_order: 1, title: '', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddConcept = () => {
    if (newConcept.trim() && !concepts.includes(newConcept.trim())) {
      setConcepts([...concepts, newConcept.trim()]);
      setNewConcept('');
    }
  };

  const handleRemoveConcept = (concept: string) => {
    setConcepts(concepts.filter(c => c !== concept));
  };

  const handleAddStep = () => {
    const newStepOrder = Math.max(...steps.map(s => s.step_order), 0) + 1;
    setSteps([...steps, { step_order: newStepOrder, title: '', description: '' }]);
  };

  const handleUpdateStep = (index: number, field: keyof FrameworkStep, value: string | number) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const updatedSteps = steps.filter((_, i) => i !== index);
      // Reorder steps
      const reorderedSteps = updatedSteps.map((step, i) => ({
        ...step,
        step_order: i + 1
      }));
      setSteps(reorderedSteps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!name.trim() || !description.trim()) {
        throw new Error('Name and description are required');
      }

      if (steps.some(step => !step.title.trim())) {
        throw new Error('All steps must have a title');
      }

      // Create framework
      console.log('Creating framework with data:', {
        name: name.trim(),
        description: description.trim(),
        concepts: concepts.length > 0 ? concepts : ['custom'],
        is_system: false
      });
      
      const frameworkResponse = await fetch('/api/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          concepts: concepts.length > 0 ? concepts : ['custom'],
          is_system: false
        }),
      });

      console.log('Framework creation response:', frameworkResponse.status, frameworkResponse.statusText);

      if (!frameworkResponse.ok) {
        const errorData = await frameworkResponse.json();
        console.error('Framework creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create framework');
      }

      const framework = await frameworkResponse.json();
      console.log('Framework created successfully:', framework);

      // Create steps
      console.log('Creating steps for framework:', framework.id, 'Steps:', steps);
      for (const step of steps) {
        if (step.title.trim()) {
          console.log('Creating step:', step);
          const stepResponse = await fetch(`/api/frameworks/${framework.id}/steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              step_order: step.step_order,
              title: step.title.trim(),
              description: step.description.trim() || null
            }),
          });

          console.log('Step creation response:', stepResponse.status, stepResponse.statusText);

          if (!stepResponse.ok) {
            const errorData = await stepResponse.json();
            console.error('Step creation failed:', errorData);
            throw new Error(errorData.error || 'Failed to create framework step');
          }
          
          const createdStep = await stepResponse.json();
          console.log('Step created successfully:', createdStep);
        }
      }

      // Reset form
      setName('');
      setDescription('');
      setConcepts([]);
      setNewConcept('');
      setSteps([{ step_order: 1, title: '', description: '' }]);

      console.log('Framework creation completed successfully, calling onSuccess...');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-(--darkelbg) text-(--foreground) rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-(--secondary)/30">
        <div className="flex items-center justify-between p-6 border-b border-(--secondary)/30 relative">
          <h2 className="text-2xl font-bold">Create Custom Framework</h2>
            <button
            onClick={onClose}
              className="absolute top-2 right-4 text-(--secondary) hover:text-(--foreground) text-2xl transition-colors duration-300 cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 text-red-300 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-(--foreground)">
                Framework Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                placeholder="Enter framework name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-(--foreground)">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                placeholder="Describe what this framework is for and how to use it"
                rows={3}
                required
              />
            </div>

            {/* Concepts */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-(--foreground)">
                Concepts/Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {concepts.map((concept, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-(--emphasis)/20 text-(--emphasis-light)"
                  >
                    {concept}
                    <button
                      type="button"
                      onClick={() => handleRemoveConcept(concept)}
                      className="ml-2 text-(--emphasis-light) hover:text-(--emphasis)"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConcept())}
                  className="flex-1 px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                  placeholder="Add a concept or tag"
                />
                <button
                  type="button"
                  onClick={handleAddConcept}
                  className="px-4 py-2 bg-(--emphasis) text-white rounded-md hover:bg-(--emphasis)/80 transition-colors duration-300 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Framework Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Framework Steps</h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-2 px-4 py-2 bg-(--emphasis) text-white rounded-md hover:bg-(--emphasis)/80 transition-colors duration-300 cursor-pointer"
              >
                <FaPlus className="w-4 h-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border border-(--secondary)/30 rounded-lg p-4 bg-(--background)">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaGripVertical className="w-4 h-4 text-(--secondary)" />
                      <span className="text-sm font-medium text-(--secondary)">
                        Step {step.step_order}
                      </span>
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 cursor-pointer"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1 text-(--foreground)">
                      Step Title *
                    </label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                      placeholder="Enter step title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-(--foreground)">
                      Step Description
                    </label>
                    <textarea
                      value={step.description}
                      onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
                      placeholder="Describe what to do in this step"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-(--secondary)/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-(--secondary)/30 text-(--foreground) rounded-md hover:bg-(--secondary)/10 transition-colors duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-(--emphasis) text-white rounded-md hover:bg-(--emphasis)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Framework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
