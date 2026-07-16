'use client';
// app/(dashboard)/dashboard/page.tsx
import { useRouter } from 'next/navigation';
import {
  Users, Building2, CheckCircle2, HomeIcon,
  Receipt, TrendingUp, TrendingDown, Wallet,
  MessageSquare, UserCheck, Bell, Landmark,
  RefreshCw,
} from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/useAdmin';
import { useAuthStore } from '@/lib/store/authStore';
import { useVisitors } from '@/lib/hooks/useOperations';
import { useComplaints } from '@/lib/hooks/useOperations';
import { useMyBills } from '@/lib/hooks/useBilling';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR',
    notation: n >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 0 }).format(n);

interface KpiConfig {
  key:     string;
  label:   string;
  icon:    React.ElementType;
  color:   string;
  bg:      string;
  format?: 'number' | 'currency';
  href:    string;
  group:   'property' | 'financial' | 'operations';
}

const KPI_CARDS: KpiConfig[] = [
  { key: 'totalMembers',   label: 'Total Members',   icon: Users,        color: '#4f7fff', bg: '#eff6ff', format: 'number',   href: '/members',   group: 'property'    },
  { key: 'totalFlats',     label: 'Total Flats',     icon: Building2,     color: '#8b5cf6', bg: '#f5f3ff', format: 'number',   href: '/flats',      group: 'property'    },
  { key: 'occupiedFlats',  label: 'Occupied',        icon: HomeIcon,      color: '#22c55e', bg: '#f0fdf4', format: 'number',   href: '/flats',      group: 'property'    },
  { key: 'vacantFlats',    label: 'Vacant',          icon: CheckCircle2,  color: '#64748b', bg: '#f1f5f9', format: 'number',   href: '/flats',      group: 'property'    },
  { key: 'pendingBills',   label: 'Pending Bills',   icon: Receipt,       color: '#f59e0b', bg: '#fffbeb', format: 'number',   href: '/maintenance', group: 'financial'   },
  { key: 'totalCollected', label: 'Collected',       icon: Wallet,        color: '#22c55e', bg: '#f0fdf4', format: 'currency', href: '/accounts',     group: 'financial'   },
  { key: 'totalIncome',    label: 'Total Income',    icon: TrendingUp,    color: '#3b82f6', bg: '#eff6ff', format: 'currency', href: '/accounts',     group: 'financial'   },
  { key: 'totalExpense',   label: 'Total Expense',   icon: TrendingDown,  color: '#ef4444', bg: '#fef2f2', format: 'currency', href: '/accounts',     group: 'financial'   },
  { key: 'openComplaints', label: 'Open Complaints', icon: MessageSquare, color: '#ef4444', bg: '#fef2f2', format: 'number',   href: '/complaints',  group: 'operations'  },
  { key: 'visitorsToday',  label: 'Visitors Today',  icon: UserCheck,     color: '#06b6d4', bg: '#ecfeff', format: 'number',   href: '/visitors',    group: 'operations'  },
  { key: 'activeNotices',  label: 'Active Notices',  icon: Bell,          color: '#f59e0b', bg: '#fffbeb', format: 'number',   href: '/notices',     group: 'operations'  },
  { key: 'bankBalance',    label: 'Bank Balance',    icon: Landmark,      color: '#8b5cf6', bg: '#f5f3ff', format: 'currency', href: '/reports',     group: 'operations'  },
];

const GROUP_LABELS = {
  property:  'Property',
  financial:  'Financial',
  operations: 'Operations',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function KpiCard({ config, value, isLoading, onClick }: {
  config: KpiConfig;
  value: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  return (
    <button onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 text-left
                 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500/30 group"
      style={{ borderTop: `3px solid ${config.color}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
             style={{ background: config.bg }}>
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <span className="text-xs text-slate-400 font-medium text-right leading-tight max-w-[80px]">
          {config.label}
        </span>
      </div>
      {isLoading ? (
        <div className="skeleton h-8 w-24 rounded" />
      ) : (
        <p className="text-2xl font-bold leading-none" style={{ color: config.color }}>
          {config.format === 'currency' ? INR(value) : value.toLocaleString('en-IN')}
        </p>
      )}
      <p className="text-xs text-slate-400 mt-2 group-hover:text-blue-400 transition-colors">
        View details →
      </p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: stats, isLoading, refetch, isFetching } = useDashboardStats();

  const isMember   = user?.role === 'MEMBER';
  const isSecurity = user?.role === 'SECURITY';

  const { data: allVisitors = [] } = useVisitors();
  const memberId = (user as any)?.memberId ?? null;
  const myVisitorsCount = isMember
    ? allVisitors.filter((v: any) => v.hostMemberId === memberId).length
    : null;

  const { data: myComplaints = [] } = useComplaints();
  const myOpenComplaints = isMember
    ? (myComplaints as any[]).filter(c => c.status === 'OPEN').length
    : null;

  const { data: myBills = [] } = useMyBills();
  const myPendingBills = isMember
    ? (myBills as any[]).filter(b => b.status === 'PENDING').length
    : null;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const getValue = (key: string): number => {
    if (!stats) return 0;
    if (key === 'visitorsToday' && isMember && myVisitorsCount !== null) return myVisitorsCount;
    if (key === 'openComplaints' && isMember && myOpenComplaints !== null) return myOpenComplaints;
    if (key === 'pendingBills' && isMember && myPendingBills !== null) return myPendingBills;
    return (stats as any)[key] ?? 0;
  };

  // Role-based hidden keys
  const MEMBER_HIDDEN_KEYS   = ['totalCollected', 'totalIncome', 'totalExpense', 'bankBalance'];
  const SECURITY_HIDDEN_KEYS = ['totalCollected', 'totalIncome', 'totalExpense', 'bankBalance', 'pendingBills', 'totalMembers', 'openComplaints', 'activeNotices'];

  const grouped = (['property', 'financial', 'operations'] as const).map(group => ({
    group,
    cards: KPI_CARDS.filter(c =>
      c.group === group &&
      !(isMember   && MEMBER_HIDDEN_KEYS.includes(c.key)) &&
      !(isSecurity && SECURITY_HIDDEN_KEYS.includes(c.key))
    ),
  })).filter(g => g.cards.length > 0);

  return (
    <div className="page-enter">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-full opacity-5 pointer-events-none"
             style={{ background: 'radial-gradient(circle at 80% 50%, #4f7fff 0%, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {getGreeting()}, {user?.fullName?.split(' ')[0] ?? 'Admin'} 👋
            </h2>
            <p className="text-slate-500 text-sm mt-1">{today}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <span className="font-semibold text-blue-500">{user?.role}</span>
            </p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                       text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors
                       disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {grouped.map(({ group, cards }) => (
          <div key={group}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {GROUP_LABELS[group]}
              </h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(card => (
                <KpiCard
                  key={card.key}
                  config={card}
                  value={getValue(card.key)}
                  isLoading={isLoading}
                  onClick={() => router.push(card.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {stats && (stats.pendingBills > 0 || (!isMember && !isSecurity && stats.openComplaints > 0)) && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.pendingBills > 0 && !isSecurity && (
            <button onClick={() => router.push('/maintenance')}
              className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {stats.pendingBills} pending bill{stats.pendingBills !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-600">Click to review and approve payments</p>
              </div>
            </button>
          )}
          {!isMember && !isSecurity && stats.openComplaints > 0 && (
            <button onClick={() => router.push('/complaints')}
              className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {stats.openComplaints} open complaint{stats.openComplaints !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-500">Click to view and resolve</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
