'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  Mail,
  BarChart3,
  Upload,
  Shield,
  Menu,
  X,
} from 'lucide-react';

interface AdminNavProps {
  userName: string;
  isSuperAdmin: boolean;
}

export function AdminNav({ userName, isSuperAdmin }: AdminNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, superAdminOnly: false },
    { href: '/admin/schools', label: 'Schools', icon: Building2, superAdminOnly: false },
    { href: '/admin/invites', label: 'Invites', icon: Mail, superAdminOnly: false },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, superAdminOnly: false },
    { href: '/admin/import', label: 'Import', icon: Upload, superAdminOnly: false },
    { href: '/admin/users', label: 'Users', icon: Users, superAdminOnly: true },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, superAdminOnly: true },
    { href: '/admin/settings', label: 'Settings', icon: Settings, superAdminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <span className="hidden font-semibold sm:inline">Permission Please</span>
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-slate-900">
                Admin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 lg:flex">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User info and mobile menu button */}
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-300 sm:inline">{userName}</span>
            <Link
              href="/api/auth/signout"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800 sm:flex"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-slate-800 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-800"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-slate-800 pt-3">
              <div className="px-3 py-2 text-sm text-slate-400">Signed in as {userName}</div>
              <Link
                href="/api/auth/signout"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-red-400 transition-colors hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
