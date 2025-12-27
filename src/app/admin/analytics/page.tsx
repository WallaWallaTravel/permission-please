'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  Clock,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Analytics {
  overview: {
    totalSchools: number;
    activeSchools: number;
    totalUsers: number;
    totalForms: number;
    totalSubmissions: number;
    signedSubmissions: number;
    responseRate: number;
    recentForms: number;
    recentSubmissions: number;
  };
  usersByRole: Record<string, number>;
  formsByStatus: Record<string, number>;
  submissionsByStatus: Record<string, number>;
  timeline: Array<{
    date: string;
    label: string;
    forms: number;
    submissions: number;
  }>;
}

const COLORS = {
  primary: '#1e3a5f',
  secondary: '#2d5a87',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const PIE_COLORS = ['#1e3a5f', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error || 'Failed to load analytics'}</p>
      </div>
    );
  }

  const { overview, usersByRole, formsByStatus, submissionsByStatus, timeline } = analytics;

  // Prepare pie chart data
  const userRoleData = Object.entries(usersByRole).map(([role, count]) => ({
    name: role.replace('_', ' '),
    value: count,
  }));

  const formStatusData = Object.entries(formsByStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const submissionStatusData = Object.entries(submissionsByStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">Platform usage and performance metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Schools"
          value={overview.totalSchools}
          subLabel={`${overview.activeSchools} active`}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={overview.totalUsers}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={FileText}
          label="Permission Forms"
          value={overview.totalForms}
          subLabel={`${overview.recentForms} this week`}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Signatures"
          value={overview.signedSubmissions}
          subLabel={`${overview.responseRate}% response rate`}
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Activity Timeline Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Activity Over Time</h2>
          <span className="text-sm text-slate-500">(Last 30 days)</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#64748b' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="forms"
                name="Forms Created"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                name="Signatures"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Users by Role */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Users by Role</h3>
          </div>
          {userRoleData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {userRoleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No users yet" />
          )}
        </div>

        {/* Forms by Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Forms by Status</h3>
          </div>
          {formStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No forms yet" />
          )}
        </div>

        {/* Submissions by Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Submissions by Status</h3>
          </div>
          {submissionStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={submissionStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {submissionStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'SIGNED'
                            ? COLORS.success
                            : entry.name === 'DECLINED'
                              ? COLORS.danger
                              : COLORS.warning
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No submissions yet" />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">This Week Summary</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{overview.recentForms}</p>
                <p className="text-sm text-slate-500">Forms created this week</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{overview.recentSubmissions}</p>
                <p className="text-sm text-slate-500">Signatures collected this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subLabel?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-slate-400">
      <BarChart3 className="mb-2 h-12 w-12" />
      <p>{message}</p>
    </div>
  );
}
