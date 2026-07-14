'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Building2, Users, Home, CreditCard,
  MessageSquare, UserCheck, Bell, BookOpen,
  Settings, Activity, LogOut, ChevronDown, ChevronRight,
  BarChart3, FolderOpen, Shield, Menu, X, Landmark, ParkingCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useSettings } from '@/lib/hooks/useAdmin';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  roles?: string[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Property', icon: Building2,
    roles: ['ADMIN', 'MANAGER', 'SECURITY'],
    children: [
      { label: 'Wings', href: '/wings', icon: Landmark },
      { label: 'Flats', href: '/flats', icon: Home },
      { label: 'Members', href: '/members', icon: Users },
      { label: 'Parking', href: '/parking', icon: ParkingCircle },
    ],
  },
  { label: 'Maintenance', href: '/maintenance', icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER'] },
  { label: 'Staff', href: '/staff', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  {
    label: 'Operations', icon: MessageSquare,
    roles: ['ADMIN', 'MANAGER', 'SECURITY', 'ACCOUNTANT', 'MEMBER'],
    children: [
      { label: 'Complaints', href: '/complaints', icon: MessageSquare, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER'] },
      { label: 'Visitors', href: '/visitors', icon: UserCheck },
      { label: 'Notices', href: '/notices', icon: Bell, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER'] },
    ],
  },
  { label: 'Accounts', href: '/accounts', icon: BookOpen, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'Vendors',  href: '/vendors',  icon: Users,    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'AMC',      href: '/amc',      icon: Shield,   roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'Documents', href: '/documents', icon: FolderOpen, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER'] },
  {
    label: 'Admin', icon: Shield, roles: ['ADMIN'],
    children: [
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Activity Log', href: '/activity-log', icon: Activity },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

async function fetchSidebarSettings() {
  const token = document.cookie
    .split('; ')
    .find((r) => r.startsWith('accessToken='))
    ?.split('=')[1];
  if (!token) return null;
  
  return data;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: settings } = useSettings()

  // Support different possible field names from backend
  const societyName: string =
    settings?.societyName ||
    settings?.society_name ||
    settings?.name ||
    'SocietyMS';

  const rawLogoPath: string | null =
    settings?.logoPath ||
    settings?.logo_path ||
    settings?.logoUrl ||
    null;

  const logoUrl = rawLogoPath
    ? rawLogoPath.startsWith('http')
      ? rawLogoPath
      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${rawLogoPath}`
    : null;

  function toggleGroup(label: string) {
    setOpenGroups((p) => ({ ...p, [label]: !p[label] }));
  }

  function hasAccess(item: NavItem) {
    if (!item.roles?.length) return true;
    return item.roles.includes(user?.role ?? '');
  }

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }

  function isGroupActive(item: NavItem) {
    return item.children?.some((c) => isActive(c.href)) ?? false;
  }

  function handleLogout() {
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    clearAuth();
    window.location.replace('/login');
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900 text-gray-100 w-64">

      {/* Logo / Name */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        {logoUrl ? (
          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white">
            <Image src={logoUrl} alt="Logo" fill className="object-contain p-0.5" unoptimized />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
            {societyName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm leading-tight text-white">{societyName}</p>
          {settings?.tagline && (
  <p className="text-xs text-gray-400 leading-tight">{settings.tagline}</p>
)}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          if (!hasAccess(item)) return null;

          if (item.children) {
            const gActive = isGroupActive(item);
            const open = openGroups[item.label] ?? gActive;
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    gActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {open && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
                    {item.children.map((child) => {
                      if (!hasAccess(child)) return null;
                      const CIcon = child.icon;
                      const cActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href!}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            cActive ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <CIcon className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-700 px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
            {user?.username?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 z-50 h-screen">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
