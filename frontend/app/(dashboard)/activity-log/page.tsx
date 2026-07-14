'use client';

import { useState } from 'react';
import { Activity, Search, RefreshCw, User, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useActivityLog } from '@/lib/hooks/useAdmin';

const ACTION_COLORS: Record<string, string> = {
  LOGIN:    'bg-green-100 text-green-700',
  LOGOUT:   'bg-slate-100 text-slate-600',
  CREATE:   'bg-blue-100 text-blue-700',
  UPDATE:   'bg-amber-100 text-amber-700',
  DELETE:   'bg-red-100 text-red-700',
  APPROVE:  'bg-purple-100 text-purple-700',
  REJECT:   'bg-red-100 text-red-600',
  UPLOAD:   'bg-teal-100 text-teal-700',
  DOWNLOAD: 'bg-indigo-100 text-indigo-700',
  GENERATE: 'bg-orange-100 text-orange-700',
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find(k => action.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : 'bg-slate-100 text-slate-600';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);

  const { data, isLoading, refetch, isFetching } = useActivityLog(search || undefined, page);

  const logs    = data?.content ?? [];
  const total   = data?.totalElements ?? 0;
  const pages   = data?.totalPages ?? 1;

  function handleSearch(val: string) {
    setSearch(val);
    setPage(0);
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Activity Log"
        subtitle="System-wide user activity and audit trail"
        actions={
          <button onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search by user, action, or module…"
          value={search} onChange={e => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
      </div>

      {/* Log Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 h-10 border-b border-slate-200" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
              {[...Array(5)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Activity className="w-10 h-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No activity logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['User', 'Action', 'Module', 'Details', 'IP Address', 'Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                        {(log.username ?? log.performedBy ?? 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-xs">{log.username ?? log.performedBy ?? '—'}</p>
                        <p className="text-xs text-slate-400">{log.userRole ?? log.role ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getActionColor(log.action ?? '')}`}>
                      {log.action ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{log.module ?? log.entityType ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                    {log.details ?? log.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs">{timeAgo(log.createdAt ?? log.timestamp)}</p>
                        <p className="text-xs text-slate-400">{formatDate(log.createdAt ?? log.timestamp)}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer / Pagination */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {logs.length} of {total} entries
            </p>
            {pages > 1 && (
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-slate-500">
                  {page + 1} / {pages}
                </span>
                <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
