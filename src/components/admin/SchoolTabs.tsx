'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, GraduationCap, FileText } from 'lucide-react';

interface SchoolTabsProps {
  schoolId: string;
  schoolName: string;
}

export function SchoolTabs({ schoolId, schoolName }: SchoolTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: `/admin/schools/${schoolId}`, label: 'Settings', icon: Settings, exact: true },
    { href: `/admin/schools/${schoolId}/users`, label: 'Users', icon: Users },
    { href: `/admin/schools/${schoolId}/students`, label: 'Students', icon: GraduationCap },
    { href: `/admin/schools/${schoolId}/forms`, label: 'Forms', icon: FileText },
  ];

  return (
    <div className="mb-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{schoolName}</h1>
      <p className="mb-4 text-sm text-gray-500">Manage school settings and data</p>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
