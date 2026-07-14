'use client';
// app/(dashboard)/notices/page.tsx

import { useState, useMemo } from 'react';
import {
  Plus, Bell, Pencil, Trash2, ToggleLeft, ToggleRight,
  BarChart3, Vote, CheckSquare, Users, AlertTriangle, X, Loader2, Printer, Download,
} from 'lucide-react';
import { printNotices, exportNoticesPdf, exportNoticesExcel } from '@/lib/utils/printUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useNotices, useCreateNotice, useUpdateNotice, useToggleNotice, useDeleteNotice,
  useNoticePoll, useCreatePoll, useVote, useAcknowledge,
} from '@/lib/hooks/useOperations';
import { noticesApi } from '@/lib/api/operations.api';
import { useQuery } from '@tanstack/react-query';
import type { Notice, PollResult, NoticeCategory } from '@/types/operations.types';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: NoticeCategory[] = ['General', 'Meeting', 'Emergency', 'Maintenance', 'Event'];

const CATEGORY_COLORS: Record<NoticeCategory, { bg: string; text: string; border: string }> = {
  General:     { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Meeting:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Emergency:   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  Maintenance: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  Event:       { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
};

const noticeSchema = z.object({
  title:     z.string().min(1, 'Title is required').max(200),
  content:   z.string().max(10000).optional().or(z.literal('')),
  category:  z.enum(['General','Meeting','Emergency','Maintenance','Event']),
  expiresAt: z.string().optional().or(z.literal('')),
});

const pollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  optionA:  z.string().min(1, 'Option A is required').max(200),
  optionB:  z.string().min(1, 'Option B is required').max(200),
  optionC:  z.string().max(200).optional().or(z.literal('')),
  optionD:  z.string().max(200).optional().or(z.literal('')),
  endsAt:   z.string().optional().or(z.literal('')),
});

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NoticesPage() {
  const { user, hasPermission } = useAuthStore();
  const isMember   = user?.role === 'MEMBER';
  const canManage  = hasPermission('manage:notices');
  const canVote    = hasPermission('vote:polls');

  const [filterCat,    setFilterCat]    = useState<string>('all');
  const [noticeModal,  setNoticeModal]  = useState(false);
  const [editTarget,   setEditTarget]   = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [pollModal,    setPollModal]    = useState<Notice | null>(null);
  const [resultsModal, setResultsModal] = useState<Notice | null>(null);
  const [ackModal,     setAckModal]     = useState<Notice | null>(null);

  const { data: notices = [], isLoading } = useNotices();
  const createNotice  = useCreateNotice();
  const updateNotice  = useUpdateNotice();
  const toggleNotice  = useToggleNotice();
  const deleteNotice  = useDeleteNotice();
  const createPoll    = useCreatePoll();
  const castVote      = useVote();
  const acknowledge   = useAcknowledge();

  const { register: regN, handleSubmit: hsN, reset: resetN, formState: { errors: errsN } } =
    useForm({ resolver: zodResolver(noticeSchema) });
  const { register: regP, handleSubmit: hsP, reset: resetP, formState: { errors: errsP } } =
    useForm({ resolver: zodResolver(pollSchema) });

  const filtered = useMemo(() =>
    notices.filter(n => filterCat === 'all' || n.category === filterCat),
    [notices, filterCat]
  );

  const counts = {
    active:    notices.filter(n => n.isActive).length,
    inactive:  notices.filter(n => !n.isActive).length,
    emergency: notices.filter(n => n.category === 'Emergency' && n.isActive).length,
  };

  const openNoticeModal = (target?: Notice) => {
    setEditTarget(target ?? null);
    resetN(target
      ? { title: target.title, content: target.content ?? '', category: target.category, expiresAt: target.expiresAt ?? '' }
      : { title: '', content: '', category: 'General', expiresAt: '' });
    setNoticeModal(true);
  };

  const onNoticeSubmit = (values: any) => {
    const payload = { ...values, expiresAt: values.expiresAt || undefined };
    if (editTarget) {
      updateNotice.mutate({ id: editTarget.id, payload },
        { onSuccess: () => { setNoticeModal(false); setEditTarget(null); } });
    } else {
      createNotice.mutate(payload, { onSuccess: () => setNoticeModal(false) });
    }
  };

  const onPollSubmit = (values: any) => {
    createPoll.mutate(
      { noticeId: pollModal!.id, payload: { ...values, endsAt: values.endsAt || undefined } },
      { onSuccess: () => setPollModal(null) }
    );
  };

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${err ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

  return (
    <div className="page-enter">
      <PageHeader
        title="Notice Board"
        subtitle="Society notices, polls, and member communications"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => printNotices(filtered.map(n => ({
                id: n.id, title: n.title, content: n.content ?? '',
                noticeType: n.category, priority: n.category === 'Emergency' ? 'High' : 'Normal',
                publishDate: new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                expiryDate: n.expiresAt ? new Date(n.expiresAt).toLocaleDateString('en-IN') : undefined,
                targetAudience: 'All', hasPoll: n.hasPoll,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => exportNoticesPdf(filtered.map(n => ({
                id: n.id, title: n.title, content: n.content ?? '',
                noticeType: n.category, priority: n.category === 'Emergency' ? 'High' : 'Normal',
                publishDate: new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                expiryDate: n.expiresAt ? new Date(n.expiresAt).toLocaleDateString('en-IN') : undefined,
                targetAudience: 'All', hasPoll: n.hasPoll,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => exportNoticesExcel(filtered.map(n => ({
                id: n.id, title: n.title, content: n.content ?? '',
                noticeType: n.category, priority: n.category === 'Emergency' ? 'High' : 'Normal',
                publishDate: new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                expiryDate: n.expiresAt ? new Date(n.expiresAt).toLocaleDateString('en-IN') : undefined,
                targetAudience: 'All', hasPoll: n.hasPoll,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> Excel
            </button>
            {canManage && (
              <button onClick={() => openNoticeModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> New Notice
              </button>
            )}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Notices', value: counts.active,    color: '#22c55e' },
          { label: 'Inactive',       value: counts.inactive,  color: '#94a3b8' },
          { label: 'Emergencies',    value: counts.emergency, color: '#ef4444' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${filterCat === cat
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {cat === 'all' ? `All (${notices.length})` : cat}
          </button>
        ))}
      </div>

      {/* Notice grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <Bell className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No notices found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(notice => {
            const catStyle = CATEGORY_COLORS[notice.category];
            return (
              <div key={notice.id}
                className={`bg-white rounded-xl border p-5 transition-all hover:shadow-md
                  ${notice.category === 'Emergency' ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>

                {/* Notice header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {notice.category === 'Emergency' && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border"
                            style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}>
                        {notice.category}
                      </span>
                      <StatusBadge value={notice.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      {notice.hasPoll && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                          Has Poll
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 leading-snug">{notice.title}</h3>
                  </div>

                  {/* Admin action buttons */}
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openNoticeModal(notice)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleNotice.mutate(notice.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        title={notice.isActive ? 'Deactivate' : 'Activate'}>
                        {notice.isActive
                          ? <ToggleRight className="w-3.5 h-3.5" />
                          : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>
                      {!notice.hasPoll && (
                        <button onClick={() => { setPollModal(notice); resetP(); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="Add poll">
                          <Vote className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setAckModal(notice)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors" title="View acks">
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(notice)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content preview */}
                {notice.content && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                    {notice.content}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-400">
                    <span>{notice.createdByName ?? 'Admin'}</span>
                    <span className="mx-1">·</span>
                    <span>{fmtDate(notice.createdAt)}</span>
                    {notice.ackCount > 0 && (
                      <>
                        <span className="mx-1">·</span>
                        <span>{notice.ackCount} ack{notice.ackCount !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>

                  {/* Member action buttons */}
                  <div className="flex gap-2">
                    {notice.hasPoll && (
                      <button onClick={() => setResultsModal(notice)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                        <BarChart3 className="w-3 h-3" />
                        {isMember ? 'Vote / Results' : 'Results'}
                      </button>
                    )}
                    {isMember && (
                      <button
                        onClick={() => acknowledge.mutate({ noticeId: notice.id, memberId: user!.memberId! })}
                        disabled={acknowledge.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                        <CheckSquare className="w-3 h-3" /> Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Notice Form Modal ─────────────────────────────────────────── */}
      {noticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setNoticeModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {editTarget ? 'Edit Notice' : 'New Notice'}
              </h3>
              <button onClick={() => setNoticeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={hsN(onNoticeSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input type="text" autoFocus className={inputCls(!!errsN.title)} {...regN('title')} />
                {errsN.title && <p className="mt-1 text-xs text-red-500">{errsN.title.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select className={inputCls()} {...regN('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Expires On</label>
                  <input type="date" className={inputCls()} {...regN('expiresAt')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                <textarea rows={5} placeholder="Notice details…"
                  className={`${inputCls()} resize-none`} {...regN('content')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setNoticeModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  disabled={createNotice.isPending || updateNotice.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {(createNotice.isPending || updateNotice.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? 'Save Changes' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Poll Form Modal ───────────────────────────────────────────── */}
      {pollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setPollModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Add Poll</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">{pollModal.title}</p>
              </div>
              <button onClick={() => setPollModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={hsP(onPollSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Question *</label>
                <textarea rows={2} className={`${inputCls(!!errsP.question)} resize-none`} {...regP('question')} />
                {errsP.question && <p className="mt-1 text-xs text-red-500">{errsP.question.message as string}</p>}
              </div>
              {(['A','B','C','D'] as const).map((opt, i) => (
                <div key={opt}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Option {opt} {i < 2 ? '*' : <span className="text-slate-400 font-normal">(optional)</span>}
                  </label>
                  <input type="text" placeholder={`Option ${opt}`}
                    className={inputCls(!!(errsP as any)[`option${opt}`])}
                    {...regP(`option${opt}` as any)} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Poll Ends At <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="datetime-local" className={inputCls()} {...regP('endsAt')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setPollModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={createPoll.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                  {createPoll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Poll Results / Vote Modal ─────────────────────────────────── */}
      {resultsModal && (
        <PollResultsModal
          notice={resultsModal}
          memberId={user?.memberId ?? null}
          isMember={isMember}
          canVote={canVote}
          onVote={(opt) => castVote.mutate(
            { noticeId: resultsModal.id, option: opt, memberId: user!.memberId! },
            { onSuccess: () => {} }
          )}
          voteLoading={castVote.isPending}
          onClose={() => setResultsModal(null)}
        />
      )}

      {/* ── Acknowledgements Modal ────────────────────────────────────── */}
      {ackModal && (
        <AcknowledgementsModal
          notice={ackModal}
          onClose={() => setAckModal(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notice"
        description={`Delete "${deleteTarget?.title}"? All associated polls, votes, and acknowledgements will also be deleted.`}
        confirmLabel="Delete Notice"
        loading={deleteNotice.isPending}
        onConfirm={() => deleteNotice.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLL RESULTS / VOTE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function PollResultsModal({ notice, memberId, isMember, canVote, onVote, voteLoading, onClose }: {
  notice: Notice; memberId: number | null;
  isMember: boolean; canVote: boolean;
  onVote: (opt: string) => void; voteLoading: boolean;
  onClose: () => void;
}) {
  const { data: poll, isLoading } = useNoticePoll(notice.id, memberId ?? undefined);

  const optionLabels = poll
    ? ['A', 'B', 'C', 'D'].filter(o =>
        o === 'A' || o === 'B' ||
        (o === 'C' && poll.optionC) ||
        (o === 'D' && poll.optionD)
      )
    : [];

  const getVotes = (o: string) => {
    if (!poll) return 0;
    return ({ A: poll.votesA, B: poll.votesB, C: poll.votesC, D: poll.votesD } as Record<string, number>)[o] ?? 0;
  };

  const getLabel = (o: string) => {
    if (!poll) return '';
    return ({ A: poll.optionA, B: poll.optionB, C: poll.optionC, D: poll.optionD } as Record<string, string | null>)[o] ?? '';
  };

  const maxVotes = poll ? Math.max(poll.votesA, poll.votesB, poll.votesC ?? 0, poll.votesD ?? 0, 1) : 1;
  const hasVoted = !!poll?.myVote;
  const showVoteButtons = isMember && canVote && !hasVoted && poll?.isActive;

  const OPTION_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Poll Results</p>
            <h3 className="font-semibold text-slate-800 leading-snug">{notice.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-3"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : !poll ? (
            <p className="text-sm text-slate-500 text-center py-4">No poll data available.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700 mb-4">{poll.question}</p>

              {/* Results bars */}
              <div className="space-y-3 mb-5">
                {optionLabels.map((opt, idx) => {
                  const votes   = getVotes(opt);
                  const pct     = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                  const isMyVote = poll.myVote === opt;
                  const color    = OPTION_COLORS[idx];

                  return (
                    <div key={opt}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className={`font-medium flex items-center gap-1.5 ${isMyVote ? 'text-blue-600' : 'text-slate-700'}`}>
                          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                style={{ background: color }}>{opt}</span>
                          {getLabel(opt)}
                          {isMyVote && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Your vote</span>}
                        </span>
                        <span className="text-slate-500">{votes} vote{votes !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full transition-all duration-500"
                             style={{ width: `${(votes / maxVotes) * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total votes */}
              <p className="text-xs text-slate-400 text-center mb-4">
                {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}
                {!poll.isActive && <span className="ml-2 text-red-500">· Poll closed</span>}
              </p>

              {/* Vote buttons */}
              {showVoteButtons && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2 text-center">Cast your vote</p>
                  <div className="grid grid-cols-2 gap-2">
                    {optionLabels.map((opt, idx) => (
                      <button key={opt}
                        onClick={() => onVote(opt)}
                        disabled={voteLoading}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50"
                        style={{ borderColor: OPTION_COLORS[idx], color: OPTION_COLORS[idx], background: `${OPTION_COLORS[idx]}10` }}>
                        {voteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                              style={{ background: OPTION_COLORS[idx] }}>{opt}</span>
                        <span className="truncate">{getLabel(opt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasVoted && (
                <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 border border-green-100">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">You voted for Option {poll.myVote}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACKNOWLEDGEMENTS MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function AcknowledgementsModal({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const { data: acks, isLoading } = useQuery({
    queryKey: ['acks', notice.id],
    queryFn: () => noticesApi.getAcks(notice.id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <p className="font-semibold text-slate-800">Acknowledgements</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{notice.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : !acks || acks.count === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No acknowledgements yet.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">{acks.count} member{acks.count !== 1 ? 's' : ''} acknowledged</p>
              <div className="space-y-2">
                {acks.members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                           style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                        {m.memberName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{m.memberName}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(m.readAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
