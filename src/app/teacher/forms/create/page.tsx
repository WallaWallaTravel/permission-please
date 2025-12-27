'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      const eventDate = new Date(formData.eventDate).toISOString();
      const deadline = new Date(formData.deadline).toISOString();

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      router.push('/teacher/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/teacher/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="font-bold text-gray-900">Permission Please 📝</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Permission Form</h2>
          <p className="mt-1 text-gray-600">Fill out the details for your new permission slip</p>
        </div>

        <form className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="space-y-6 p-6">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g., Zoo Field Trip Permission"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Provide details about the event, including location, activities, what to bring, etc."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eventType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="eventType"
                    id="eventType"
                    required
                    value={formData.eventType}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="FIELD_TRIP">🚌 Field Trip</option>
                    <option value="SPORTS">⚽ Sports Event</option>
                    <option value="ACTIVITY">🎨 Activity</option>
                    <option value="OTHER">📋 Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eventDate"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Event Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    id="eventDate"
                    required
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Signature Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    id="deadline"
                    required
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Custom Questions</h3>
                <p className="text-sm text-gray-500">Add any additional questions for parents</p>
              </div>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Question
              </button>
            </div>

            <div className="p-6">
              {fields.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No custom questions added yet.</p>
                  <p className="text-sm">
                    Click &quot;Add Question&quot; to include additional fields.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="font-medium text-gray-400">{index + 1}.</div>
                        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-12">
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="Question text"
                              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <select
                              value={field.fieldType}
                              onChange={(e) =>
                                updateField(field.id, {
                                  fieldType: e.target.value as FormField['fieldType'],
                                })
                              }
                              className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="checkbox">Yes/No</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                          <div className="flex items-center sm:col-span-2">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(field.id, { required: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              />
                              <span className="text-sm text-gray-600">Required</span>
                            </label>
                          </div>
                          <div className="flex items-center justify-end sm:col-span-1">
                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end gap-3 pt-4 sm:flex-row">
            <Link
              href="/teacher/dashboard"
              className="rounded-xl border-2 border-gray-200 px-6 py-3 text-center font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading}
              className="rounded-xl bg-gray-600 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create & Activate'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
