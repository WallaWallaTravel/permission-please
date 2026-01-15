import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { PrintFormClient } from './PrintFormClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintFormPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch the form
  const form = await prisma.permissionForm.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          name: true,
          email: true,
        },
      },
      fields: {
        orderBy: { order: 'asc' },
      },
      documents: {
        orderBy: { order: 'asc' },
      },
      shares: {
        where: { userId: user.id },
      },
    },
  });

  if (!form) {
    notFound();
  }

  // Check permissions
  const isOwner = form.teacherId === user.id;
  const hasAccess = isOwner || form.shares.length > 0 || user.role === 'ADMIN';

  if (!hasAccess) {
    redirect('/teacher/forms');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @page {
          margin: 0.75in;
        }
      `}</style>

      {/* Print controls - hidden when printing */}
      <PrintFormClient formId={form.id} />

      {/* Printable content */}
      <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-900 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {form.eventType.replace('_', ' ')} - Organized by {form.teacher.name}
          </p>
        </div>

        {/* Event Details */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Event Date:</span>{' '}
            {format(new Date(form.eventDate), 'EEEE, MMMM d, yyyy')}
          </div>
          <div>
            <span className="font-semibold">Signature Deadline:</span>{' '}
            {format(new Date(form.deadline), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Event Description</h2>
          <p className="whitespace-pre-wrap text-gray-700">{form.description}</p>
        </div>

        {/* Attached Documents Notice */}
        {form.documents.length > 0 && (
          <div className="mb-8 rounded border border-gray-300 bg-gray-50 p-4">
            <h2 className="mb-2 font-semibold text-gray-900">Additional Documents</h2>
            <p className="mb-2 text-sm text-gray-600">
              The following documents are attached to this permission form:
            </p>
            <ul className="list-inside list-disc text-sm text-gray-700">
              {form.documents.map((doc) => (
                <li key={doc.id}>
                  {doc.fileName}
                  {doc.description && ` - ${doc.description}`}
                  {doc.requiresAck && ' (requires acknowledgment)'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Custom Fields */}
        {form.fields.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Additional Information Required
            </h2>
            <div className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {field.fieldType === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border border-gray-400" />
                      <span className="text-sm text-gray-600">Yes / I agree</span>
                    </div>
                  ) : field.fieldType === 'textarea' ? (
                    <div className="h-24 border border-gray-400" />
                  ) : (
                    <div className="h-8 border-b border-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Info Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Student Name</label>
              <div className="h-8 border-b border-gray-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Grade/Class</label>
              <div className="h-8 border-b border-gray-400" />
            </div>
          </div>
        </div>

        {/* Parent/Guardian Consent Section */}
        <div className="mb-8 rounded border-2 border-gray-900 p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Parent/Guardian Consent</h2>

          <p className="mb-4 text-sm text-gray-700">
            I, the undersigned parent/guardian, give permission for my child to participate in the
            above-described activity. I understand the nature of the activity and agree to allow my
            child&apos;s participation. I have reviewed and acknowledge any attached documents.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parent/Guardian Name (Print)
              </label>
              <div className="h-8 border-b border-gray-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Relationship to Student
              </label>
              <div className="h-8 border-b border-gray-400" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Signature</label>
              <div className="h-12 border-b-2 border-gray-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <div className="h-8 border-b border-gray-400" />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Phone Number
            </label>
            <div className="h-8 border-b border-gray-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>Please return this signed form by {format(new Date(form.deadline), 'MMMM d, yyyy')}</p>
          <p className="mt-1">
            For questions, contact {form.teacher.name} at {form.teacher.email}
          </p>
        </div>
      </div>
    </div>
  );
}
