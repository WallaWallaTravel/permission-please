'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates';

type FormField = {
  id: string;
  fieldType: 'text' | 'checkbox' | 'date' | 'textarea';
  label: string;
  required: boolean;
  order: number;
};

type ReminderInterval = {
  id: string;
  value: number;
  unit: 'days' | 'hours';
};

type FormDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description: string;
  source: string;
  requiresAck: boolean;
};

// Preset reminder schedules
const PRESET_SCHEDULES = {
  standard: [
    { value: 7, unit: 'days' as const },
    { value: 3, unit: 'days' as const },
    { value: 1, unit: 'days' as const },
  ],
  urgent: [
    { value: 3, unit: 'days' as const },
    { value: 1, unit: 'days' as const },
    { value: 18, unit: 'hours' as const },
  ],
  thorough: [
    { value: 7, unit: 'days' as const },
    { value: 3, unit: 'days' as const },
    { value: 2, unit: 'days' as const },
    { value: 1, unit: 'days' as const },
    { value: 18, unit: 'hours' as const },
  ],
};

export default function CreateFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'FIELD_TRIP' as const,
    deadline: '',
    status: 'DRAFT' as const,
  });

  const [fields, setFields] = useState<FormField[]>([]);

  // Reminder settings
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderIntervals, setReminderIntervals] = useState<ReminderInterval[]>(
    PRESET_SCHEDULES.standard.map((r, i) => ({ ...r, id: `reminder-${i}` }))
  );

  // Document uploads
  const [documents, setDocuments] = useState<FormDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Review workflow (for waiver/consent forms)
  const [requiresReview, setRequiresReview] = useState(false);
  const [reviewNeededBy, setReviewNeededBy] = useState('');
  const [isExpedited, setIsExpedited] = useState(false);

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

  // Reminder helper functions
  const addReminder = () => {
    const newReminder: ReminderInterval = {
      id: `reminder-${Date.now()}`,
      value: 1,
      unit: 'days',
    };
    setReminderIntervals([...reminderIntervals, newReminder]);
  };

  const updateReminder = (id: string, updates: Partial<ReminderInterval>) => {
    setReminderIntervals(reminderIntervals.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeReminder = (id: string) => {
    setReminderIntervals(reminderIntervals.filter((r) => r.id !== id));
  };

  const applyPreset = (preset: keyof typeof PRESET_SCHEDULES) => {
    setReminderIntervals(PRESET_SCHEDULES[preset].map((r, i) => ({ ...r, id: `reminder-${i}` })));
  };

  // Document helper functions
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for now)
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploadingDoc(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      const newDoc: FormDocument = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileUrl: data.url,
        fileSize: file.size,
        mimeType: file.type,
        description: '',
        source: 'external',
        requiresAck: true,
      };

      setDocuments([...documents, newDoc]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const updateDocument = (id: string, updates: Partial<FormDocument>) => {
    setDocuments(documents.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const applyTemplate = (template: FormTemplate) => {
    setFormData({
      title: template.title,
      description: template.formDescription,
      eventDate: '',
      eventType: template.eventType as typeof formData.eventType,
      deadline: '',
      status: 'DRAFT' as const,
    });
    setFields(
      template.fields.map((f, i) => ({
        ...f,
        id: `field-template-${i}`,
      }))
    );
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.eventDate) {
      setError('Event date is required');
      return;
    }
    if (!formData.deadline) {
      setError('Signature deadline is required');
      return;
    }

    const eventDateObj = new Date(formData.eventDate);
    const deadlineObj = new Date(formData.deadline);

    if (deadlineObj >= eventDateObj) {
      setError(
        'Signature Deadline: Must be before the event date. Please set a deadline that gives parents time to sign before the event.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const eventDate = eventDateObj.toISOString();
      const deadline = deadlineObj.toISOString();

      // Format reminder schedule for API
      const reminderSchedule = reminderIntervals.map((r) => ({
        value: r.value,
        unit: r.unit,
      }));

      // Format documents for API
      const formDocuments = documents.map((d) => ({
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        description: d.description,
        source: d.source,
        requiresAck: d.requiresAck,
      }));

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventDate,
          deadline,
          status: isDraft ? 'DRAFT' : 'ACTIVE',
          remindersEnabled,
          reminderSchedule,
          documents: formDocuments,
          // Review workflow fields
          requiresReview,
          reviewNeededBy:
            requiresReview && reviewNeededBy ? new Date(reviewNeededBy).toISOString() : null,
          isExpedited: requiresReview ? isExpedited : false,
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
        // Parse validation errors for user-friendly messages
        if (data.details && Array.isArray(data.details)) {
          const messages = data.details.map((issue: { path?: string[]; message?: string }) => {
            const field = issue.path?.join('.') || 'form';
            const message = issue.message || 'Invalid value';
            // Map field names to user-friendly labels
            const fieldLabels: Record<string, string> = {
              title: 'Title',
              description: 'Description',
              eventDate: 'Event Date',
              deadline: 'Signature Deadline',
              eventType: 'Event Type',
            };
            const label = fieldLabels[field] || field;
            return `${label}: ${message}`;
          });
          throw new Error(messages.join('\n'));
        }
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

        {showTemplates ? (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Choose a Template</h3>
              <p className="text-sm text-gray-600">
                Start with a pre-built template or create from scratch
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Start from Scratch */}
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="group rounded-xl border-2 border-dashed border-gray-300 p-6 text-left transition-all hover:border-blue-400 hover:bg-blue-50/50"
              >
                <div className="mb-3 text-3xl">✏️</div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Start from Scratch
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Build a custom form with your own fields
                </p>
              </button>

              {/* Templates */}
              {FORM_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="mb-3 text-3xl">{template.icon}</div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {template.name}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {template.fields.length} field{template.fields.length !== 1 && 's'}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {template.eventType.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Back to templates link */}
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="mb-6 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to templates
            </button>

            <form className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-red-700">
                      {error.includes('\n') ? (
                        <ul className="list-inside list-disc space-y-1">
                          {error.split('\n').map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{error}</p>
                      )}
                    </div>
                  </div>
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
                      <p className="mt-1 text-sm text-gray-600">Must be before the event date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Custom Questions</h3>
                    <p className="text-sm text-gray-500">
                      Add any additional questions for parents
                    </p>
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

              {/* Reminder Settings */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Reminder Settings</h3>
                    <p className="text-sm text-gray-500">
                      Configure automated reminders for parents who haven&apos;t signed
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remindersEnabled}
                      onChange={(e) => setRemindersEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Reminders</span>
                  </label>
                </div>

                {remindersEnabled && (
                  <div className="p-6">
                    {/* Preset Buttons */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => applyPreset('standard')}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Standard (7, 3, 1 days)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('urgent')}
                        className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
                      >
                        Urgent (3, 1 day, 18h)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('thorough')}
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        Thorough (7, 3, 2, 1 day, 18h)
                      </button>
                    </div>

                    {/* Reminder List */}
                    <div className="space-y-3">
                      {reminderIntervals.map((reminder, index) => (
                        <div
                          key={reminder.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={reminder.value}
                            onChange={(e) =>
                              updateReminder(reminder.id, { value: parseInt(e.target.value) || 1 })
                            }
                            className="w-20 rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-gray-900 outline-none focus:border-blue-500"
                          />
                          <select
                            value={reminder.unit}
                            onChange={(e) =>
                              updateReminder(reminder.id, {
                                unit: e.target.value as 'days' | 'hours',
                              })
                            }
                            className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                          >
                            <option value="days">days before</option>
                            <option value="hours">hours before</option>
                          </select>
                          <span className="text-sm text-gray-500">deadline</span>
                          <button
                            type="button"
                            onClick={() => removeReminder(reminder.id)}
                            className="ml-auto p-1 text-red-500 hover:text-red-700"
                            disabled={reminderIntervals.length <= 1}
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addReminder}
                      className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add another reminder
                    </button>
                  </div>
                )}
              </div>

              {/* External Documents */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">External Documents</h3>
                    <p className="text-sm text-gray-500">
                      Upload venue waivers, facility requirements, or other documents parents need
                      to review
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {isUploadingDoc ? 'Uploading...' : 'Upload PDF'}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDocumentUpload}
                      disabled={isUploadingDoc}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-6">
                  {documents.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="mt-2">No external documents added yet.</p>
                      <p className="text-sm">
                        Upload PDFs that parents need to review and acknowledge (e.g., venue
                        waivers).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-red-100 p-2">
                              <svg
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">{doc.fileName}</p>
                                <button
                                  type="button"
                                  onClick={() => removeDocument(doc.id)}
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
                              <p className="text-sm text-gray-500">
                                {(doc.fileSize / 1024).toFixed(1)} KB
                              </p>
                              <div className="mt-3 space-y-3">
                                <input
                                  type="text"
                                  value={doc.description}
                                  onChange={(e) =>
                                    updateDocument(doc.id, { description: e.target.value })
                                  }
                                  placeholder="Add a description (e.g., 'Zoo waiver form')"
                                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                />
                                <div className="flex items-center gap-4">
                                  <select
                                    value={doc.source}
                                    onChange={(e) =>
                                      updateDocument(doc.id, { source: e.target.value })
                                    }
                                    className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                  >
                                    <option value="external">External Venue</option>
                                    <option value="school">School Document</option>
                                    <option value="district">District Policy</option>
                                  </select>
                                  <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={doc.requiresAck}
                                      onChange={(e) =>
                                        updateDocument(doc.id, { requiresAck: e.target.checked })
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600">
                                      Require acknowledgment
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Workflow */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Review Workflow</h3>
                    <p className="text-sm text-gray-500">
                      Enable review for forms containing waivers or consent language
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requiresReview}
                      onChange={(e) => setRequiresReview(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Requires Review</span>
                  </label>
                </div>

                {requiresReview && (
                  <div className="space-y-4 p-6">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-amber-800">
                          Forms requiring review must be approved by a school reviewer before they
                          can be sent to parents. After saving as draft, you&apos;ll be able to
                          submit it for review.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="reviewNeededBy"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Review Needed By (optional)
                        </label>
                        <input
                          type="datetime-local"
                          id="reviewNeededBy"
                          value={reviewNeededBy}
                          onChange={(e) => setReviewNeededBy(e.target.value)}
                          className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <p className="mt-1 text-sm text-gray-600">
                          When do you need this approved by?
                        </p>
                      </div>

                      <div className="flex items-center">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isExpedited}
                            onChange={(e) => setIsExpedited(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-orange-600"
                          />
                          <div>
                            <span className="font-medium text-gray-900">Mark as Expedited</span>
                            <p className="text-sm text-gray-600">
                              Urgent requests will be highlighted for reviewers
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
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
          </>
        )}
      </main>
    </div>
  );
}
