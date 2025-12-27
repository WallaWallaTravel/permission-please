'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SchoolTabs } from '@/components/admin/SchoolTabs';

interface Form {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  deadline: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    submissions: number;
    fields: number;
  };
}

interface School {
  id: string;
  name: string;
}

const statusConfig = {
  DRAFT: { label: 'Draft', icon: Clock, className: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Active', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', icon: XCircle, className: 'bg-red-100 text-red-700' },
};

export default function SchoolFormsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [school, setSchool] = useState<School | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [schoolRes, formsRes] = await Promise.all([
          fetch(`/api/admin/schools/${id}`),
          fetch(`/api/admin/forms?schoolId=${id}`),
        ]);

        if (!schoolRes.ok) throw new Error('Failed to fetch school');

        const schoolData = await schoolRes.json();
        setSchool(schoolData.school);

        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData.forms || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">School not found</p>
        <Link href="/admin/schools" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Schools
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/schools"
        className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Link>

      <SchoolTabs schoolId={id} schoolName={school.name} />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Permission Forms</h2>
            <p className="text-sm text-gray-500">Forms created for this school</p>
          </div>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 p-4 text-red-700">{error}</div>}

        {forms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No forms yet</h3>
            <p className="text-gray-500">
              Teachers at this school haven&apos;t created any forms yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forms.map((form) => {
                  const status = statusConfig[form.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-900">{form.title}</span>
                            <span className="text-xs text-gray-500">{form.eventType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="block text-gray-900">{form.teacher.name}</span>
                          <span className="text-xs text-gray-500">{form.teacher.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(form.eventDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{form._count.submissions}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
