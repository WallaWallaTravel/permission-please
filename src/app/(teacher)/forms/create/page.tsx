'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormField = {
  id: string;
  fieldType: 'text' | 'checkbox' | 'date' | 'textarea';
  label: string;
  required: boolean;
  order: number;
};

export default function CreateFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'FIELD_TRIP' as const,
    deadline: '',
    status: 'DRAFT' as const,
  });

  const [fields, setFields] = useState<FormField[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      fieldType: 'text',
      label: '',
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Convert dates to ISO format
      const eventDate = new Date(formData.eventDate).toISOString();
      const deadline = new Date(formData.deadline).toISOString();

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventDate,
          deadline,
          status: isDraft ? 'DRAFT' : 'ACTIVE',
          fields: fields.map((field) => ({
            fieldType: field.fieldType,
            label: field.label,
            required: field.required,
            order: field.order,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create form');
      }

      // Success! Redirect to dashboard
      router.push('/teacher/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <a href="/teacher/dashboard" className="text-xl font-bold text-gray-900">
                Permission Please 📝
              </a>
            </div>
            <a
              href="/teacher/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl leading-tight font-bold tracking-tight text-gray-900">
                Create Permission Form
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Fill out the form details and add any custom fields you need.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-8">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
                <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
                      Form Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Zoo Field Trip"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Description *
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Provide details about the event..."
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="eventType"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Event Type *
                    </label>
                    <select
                      name="eventType"
                      id="eventType"
                      required
                      value={formData.eventType}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="FIELD_TRIP">Field Trip</option>
                      <option value="SPORTS">Sports Event</option>
                      <option value="ACTIVITY">Activity</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3"></div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="eventDate"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Event Date *
                    </label>
                    <input
                      type="datetime-local"
                      name="eventDate"
                      id="eventDate"
                      required
                      value={formData.eventDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="deadline" className="block text-sm font-semibold text-gray-900">
                      Signature Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      id="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Custom Fields</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add additional questions or information fields
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addField}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    + Add Field
                  </button>
                </div>

                {fields.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                          <div className="sm:col-span-5">
                            <label className="block text-sm font-semibold text-gray-900">
                              Field Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                              placeholder="e.g., Emergency Contact Number"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-sm font-semibold text-gray-900">
                              Field Type
                            </label>
                            <select
                              value={field.fieldType}
                              onChange={(e) =>
                                updateField(field.id, {
                                  fieldType: e.target.value as FormField['fieldType'],
                                })
                              }
                              className="mt-1 block w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="date">Date</option>
                            </select>
                          </div>

                          <div className="flex items-end sm:col-span-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(field.id, { required: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Required</span>
                            </label>
                          </div>

                          <div className="flex items-end sm:col-span-1">
                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="text-red-600 hover:text-red-500"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-x-3">
              <a
                href="/teacher/dashboard"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create & Activate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
