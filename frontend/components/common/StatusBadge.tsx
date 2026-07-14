'use client';
// components/common/StatusBadge.tsx

type BadgeVariant =
  | 'PAID' | 'PENDING' | 'APPROVED' | 'REJECTED'
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  | 'OCCUPIED' | 'VACANT'
  | 'ACTIVE' | 'INACTIVE'
  | 'OWNER' | 'TENANT' | 'CO_OWNER'
  | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SECURITY' | 'MEMBER'
  | 'EMERGENCY' | 'General' | 'Meeting' | 'Maintenance' | 'Event';

const BADGE_STYLES: Record<string, string> = {
  // Billing
  PAID:        'bg-green-100 text-green-700',
  PENDING:     'bg-amber-100 text-amber-700',
  // Approval
  APPROVED:    'bg-green-100 text-green-700',
  REJECTED:    'bg-red-100 text-red-600',
  // Complaints
  OPEN:        'bg-red-100 text-red-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-slate-100 text-slate-500',
  // Flats
  OCCUPIED:    'bg-blue-100 text-blue-700',
  VACANT:      'bg-slate-100 text-slate-500',
  // People
  ACTIVE:      'bg-green-100 text-green-700',
  INACTIVE:    'bg-slate-100 text-slate-500',
  // Member types
  OWNER:       'bg-purple-100 text-purple-700',
  TENANT:      'bg-cyan-100 text-cyan-700',
  CO_OWNER:    'bg-indigo-100 text-indigo-700',
  // Roles
  ADMIN:       'bg-red-100 text-red-700',
  MANAGER:     'bg-orange-100 text-orange-700',
  ACCOUNTANT:  'bg-blue-100 text-blue-700',
  SECURITY:    'bg-yellow-100 text-yellow-700',
  MEMBER:      'bg-slate-100 text-slate-600',
  // Notice categories
  EMERGENCY:   'bg-red-100 text-red-700 font-semibold',
  General:     'bg-slate-100 text-slate-600',
  Meeting:     'bg-blue-100 text-blue-700',
  Maintenance: 'bg-amber-100 text-amber-700',
  Event:       'bg-green-100 text-green-700',
};

const BADGE_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  CO_OWNER:    'Co-Owner',
};

interface StatusBadgeProps {
  value: string;
  className?: string;
}

export default function StatusBadge({ value, className = '' }: StatusBadgeProps) {
  const style  = BADGE_STYLES[value] ?? 'bg-slate-100 text-slate-600';
  const label  = BADGE_LABELS[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace('_', ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
