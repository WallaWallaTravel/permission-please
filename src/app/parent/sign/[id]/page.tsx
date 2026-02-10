'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { SignatureCanvas } from '@/components/signatures/SignatureCanvas';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
  hasSigned?: boolean;
}

interface FormDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  description: string | null;
  source: string;
  requiresAck: boolean;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  deadline: string;
  teacher: {
    name: string;
  };
  fields: Array<{
    id: string;
    fieldType: string;
    label: string;
    required: boolean;
  }>;
  documents: FormDocument[];
  students: Student[]; // Changed to array for multi-student support
}

export default function SignFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [fieldResponses, setFieldResponses] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [documentAcks, setDocumentAcks] = useState<Record<string, boolean>>({});
  const signatureContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(480);

  useEffect(() => {
    function updateCanvasWidth() {
      if (signatureContainerRef.current) {
        // Use container width minus padding (48px = 24px each side)
        setCanvasWidth(Math.min(480, signatureContainerRef.current.clientWidth - 48));
      }
    }
    updateCanvasWidth();
    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, []);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/forms/${id}/sign`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Form not found or access denied');
        }
        const data = await res.json();

        // Transform single student to array for backwards compatibility
        const students = data.students || (data.student ? [data.student] : []);
        setForm({ ...data, students });

        // Auto-select if only one student
        const unsignedStudents = students.filter((s: Student) => !s.hasSigned);
        if (unsignedStudents.length === 1) {
          setSelectedStudent(unsignedStudents[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [id]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSignature(null);
    setAgreed(false);
    setFieldResponses({});
    setDocumentAcks({});
  };

  const handleDocumentAck = (docId: string, checked: boolean) => {
    setDocumentAcks((prev) => ({ ...prev, [docId]: checked }));
  };

  // Check if all required documents are acknowledged
  const requiredDocs = form?.documents?.filter((d) => d.requiresAck) || [];
  const allDocsAcknowledged = requiredDocs.every((d) => documentAcks[d.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (!signature) {
      setError('Please provide your signature');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms');
      return;
    }

    if (!allDocsAcknowledged) {
      setError('Please acknowledge all required documents');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/forms/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: signature,
          studentId: selectedStudent.id,
          fieldResponses,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit signature');
      }

      // Check if there are more students to sign for
      const remainingStudents =
        form?.students.filter((s) => s.id !== selectedStudent.id && !s.hasSigned) || [];

      if (remainingStudents.length > 0) {
        // Mark current student as signed and reset for next
        setForm((prev) =>
          prev
            ? {
                ...prev,
                students: prev.students.map((s) =>
                  s.id === selectedStudent.id ? { ...s, hasSigned: true } : s
                ),
              }
            : null
        );
        setSelectedStudent(null);
        setSignature(null);
        setAgreed(false);
        setFieldResponses({});

        // Show success message briefly
        setError('');
        alert(`Signed for ${selectedStudent.name}! You can now sign for another child.`);
      } else {
        router.push('/parent/dashboard?signed=true');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" aria-hidden="true" />
          <p className="text-gray-600">Loading permission form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" aria-hidden="true" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Unable to Load Form</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const eventDate = new Date(form.eventDate);
  const deadline = new Date(form.deadline);
  const isOverdue = deadline < new Date();
  const unsignedStudents = form.students.filter((s) => !s.hasSigned);
  const signedStudents = form.students.filter((s) => s.hasSigned);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/parent/dashboard"
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Link>
          <h1 className="font-bold text-gray-900">Permission Please 📝</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Form Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-blue-100">Permission Form</p>
                <h2 className="text-2xl font-bold">{form.title}</h2>
                <p className="mt-2 text-blue-100">From: {form.teacher.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  isOverdue ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                }`}
              >
                {isOverdue ? 'Overdue' : form.eventType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Event Details */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Event Date</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div
                  className={`mb-1 flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>Sign By</span>
                </div>
                <p className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                  {deadline.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-gray-900">Event Details</h3>
              <p className="whitespace-pre-wrap text-gray-700">{form.description}</p>
            </div>

            {/* External Documents */}
            {form.documents && form.documents.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-900">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Required Documents ({form.documents.length})
                </h3>
                <p className="mb-4 text-sm text-amber-800">
                  Please review and acknowledge the following documents before signing.
                </p>
                <div className="space-y-3">
                  {form.documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-red-100 p-2">
                            <svg
                              className="h-5 w-5 text-red-600"
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
                          <div>
                            <p className="font-medium text-gray-900">{doc.fileName}</p>
                            {doc.description && (
                              <p className="mt-1 text-sm text-gray-600">{doc.description}</p>
                            )}
                            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {doc.source === 'external'
                                ? 'External Venue'
                                : doc.source === 'school'
                                  ? 'School Document'
                                  : 'District Policy'}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          View PDF
                        </a>
                      </div>
                      {doc.requiresAck && (
                        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <input
                            type="checkbox"
                            checked={documentAcks[doc.id] || false}
                            onChange={(e) => handleDocumentAck(doc.id, e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            I have read and acknowledge this document
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Student Selection */}
        {form.students.length > 1 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-semibold text-gray-900">Select Child to Sign For</h3>

            {signedStudents.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">Already signed:</p>
                <div className="flex flex-wrap gap-2">
                  {signedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      {student.name} (Grade {student.grade})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unsignedStudents.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {unsignedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleStudentSelect(student)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      selectedStudent?.id === student.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={selectedStudent?.id === student.id}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                          selectedStudent?.id === student.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">Grade {student.grade}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" aria-hidden="true" />
                <p className="font-medium text-green-700">All children have been signed!</p>
                <Link
                  href="/parent/dashboard"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                >
                  Return to Dashboard →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Show signing form only if student is selected */}
        {selectedStudent && (
          <form onSubmit={handleSubmit}>
            {/* Selected Student Indicator (for single student) */}
            {form.students.length === 1 && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Signing for: {selectedStudent.name}</p>
                  <p className="text-sm text-gray-500">Grade {selectedStudent.grade}</p>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {form.fields.length > 0 && (
              <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 font-semibold text-gray-900">Additional Information</h3>
                <div className="space-y-4">
                  {form.fields.map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={field.id}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-500" aria-hidden="true">
                            *
                          </span>
                        )}
                      </label>
                      {field.fieldType === 'textarea' ? (
                        <textarea
                          id={field.id}
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          rows={3}
                          required={field.required}
                          value={fieldResponses[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          aria-required={field.required}
                        />
                      ) : field.fieldType === 'checkbox' ? (
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            id={field.id}
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            required={field.required}
                            checked={fieldResponses[field.id] === 'true'}
                            onChange={(e) =>
                              handleFieldChange(field.id, e.target.checked ? 'true' : 'false')
                            }
                          />
                          <span className="text-gray-700">Yes</span>
                        </label>
                      ) : field.fieldType === 'date' ? (
                        <input
                          id={field.id}
                          type="date"
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          required={field.required}
                          value={fieldResponses[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          aria-required={field.required}
                        />
                      ) : (
                        <input
                          id={field.id}
                          type="text"
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          required={field.required}
                          value={fieldResponses[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          aria-required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div ref={signatureContainerRef} className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 font-semibold text-gray-900">Your Signature</h3>
              <p className="mb-4 text-sm text-gray-600">
                By signing below, I grant permission for <strong>{selectedStudent.name}</strong> to
                participate in the above activity. I understand and accept all terms and conditions.
              </p>

              <SignatureCanvas onSignatureChange={setSignature} width={canvasWidth} height={180} />

              {/* Agreement Checkbox */}
              <label className="mt-6 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  aria-describedby="agreement-description"
                />
                <span id="agreement-description" className="text-sm text-gray-700">
                  I confirm that I am the parent/guardian of {selectedStudent.name} and I grant
                  permission for them to participate in this activity. I understand that this
                  electronic signature is legally binding.
                </span>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div
                className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
                role="alert"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                  aria-hidden="true"
                />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !signature || !agreed || !allDocsAcknowledged || isOverdue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Submitting...</span>
                </>
              ) : isOverdue ? (
                'Form Deadline Passed'
              ) : (
                <>
                  Submit Permission
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Prompt to select student if multi-student and none selected */}
        {form.students.length > 1 && !selectedStudent && unsignedStudents.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-800">
              Please select a child above to sign the permission form.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
