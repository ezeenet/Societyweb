'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/layout/TopBar.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

// Human-readable page titles for the breadcrumb
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/members':     'Members',
  '/flats':       'Flats & Wings',
  '/maintenance': 'Maintenance',
  '/complaints':  'Complaints',
  '/visitors':    'Visitors',
  '/notices':     'Notices',
  '/accounts':    'Accounts',
  '/documents':   'Documents',
  '/reports':     'Reports',
  '/settings':    'Settings',
  '/users':       'User Management',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] ?? 'SocietyMS';

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 border-b border-slate-200/70 flex-shrink-0"
            style={{ backdropFilter: 'blur(12px)' }}>

      {/* Left: Greeting + page title */}
      <div>
        <h1 className="text-base font-semibold text-slate-800">{pageTitle}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {getGreeting()}, {user?.fullName?.split(' ')[0]} &mdash; {formattedDate}
        </p>
      </div>

      {/* Right: Notification bell + avatar */}
      <div className="flex items-center gap-3">

        {/* Notification bell (Phase 7 — wired to WebSocket) */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
          <Bell className="w-4.5 h-4.5" />
          {/* Active indicator (replace with actual unread count in Phase 7) */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            {user ? getInitials(user.fullName) : '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user?.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>

    </header>
  );
}
