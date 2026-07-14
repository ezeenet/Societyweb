'use client';
// app/(dashboard)/documents/page.tsx

import { useState, useRef } from 'react';
import {
  FolderOpen, Upload, Trash2, Download, FileText,
  File, FileImage, Archive, Loader2, X,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/lib/hooks/useAdmin';
import { useMembers } from '@/lib/hooks/useProperty';
import { documentsApi } from '@/lib/api/admin.api';
import { useAuthStore } from '@/lib/store/authStore';
import type { DocumentFile, DocType } from '@/types/admin.types';
import { DOC_TYPES } from '@/types/admin.types';

const fmtSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="w-5 h-5 text-slate-400" />;
  if (mime.includes('pdf'))   return <FileText className="w-5 h-5 text-red-500" />;
  if (mime.includes('image')) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (mime.includes('zip') || mime.includes('archive'))
                              return <Archive className="w-5 h-5 text-amber-500" />;
  return <FileText className="w-5 h-5 text-slate-400" />;
}

export default function DocumentsPage() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage:documents');

  const [activeType,   setActiveType]   = useState<DocType | 'all'>('all');
  const [uploadModal,  setUploadModal]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentFile | null>(null);

  // Upload form state
  const [uploadTitle,   setUploadTitle]   = useState('');
  const [uploadType,    setUploadType]    = useState<DocType>('Society');
  const [uploadMember,  setUploadMember]  = useState<number | undefined>();
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs    = [], isLoading } = useDocuments(activeType === 'all' ? undefined : activeType);
  const { data: members = [] }             = useMembers();

  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadTitle.trim()) return;
    uploadDoc.mutate(
      { title: uploadTitle.trim(), documentType: uploadType, memberId: uploadMember, file: selectedFile },
      { onSuccess: () => {
          setUploadModal(false);
          setSelectedFile(null);
          setUploadTitle('');
          setUploadType('Society');
          setUploadMember(undefined);
        }
      }
    );
  };

  const TYPE_COLORS: Record<string, string> = {
    Society:   'bg-blue-50 text-blue-700 border-blue-200',
    Legal:     'bg-purple-50 text-purple-700 border-purple-200',
    Financial: 'bg-green-50 text-green-700 border-green-200',
    Member:    'bg-amber-50 text-amber-700 border-amber-200',
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="page-enter">
      <PageHeader
        title="Documents"
        subtitle="Society documents, legal files, and member records"
        actions={canManage && (
          <button onClick={() => setUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        )}
      />

      {/* Type filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(['all', ...DOC_TYPES] as const).map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${activeType === t
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {t === 'all' ? `All (${docs.length})` : t}
          </button>
        ))}
      </div>

      {/* Documents grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <FolderOpen className="w-10 h-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No documents uploaded yet.</p>
          {canManage && (
            <button onClick={() => setUploadModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              <Upload className="w-4 h-4" /> Upload first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <div key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileIcon mime={doc.mimeType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-snug truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[doc.documentType] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {doc.documentType}
                </span>
                <span className="text-xs text-slate-400">{fmtSize(doc.fileSize)}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  <p>{doc.uploadedByName ?? 'Unknown'}</p>
                  <p>{fmtDate(doc.createdAt)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => documentsApi.download(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {canManage && (
                    <button onClick={() => setDeleteTarget(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setUploadModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Upload Document</h3>
              <button onClick={() => setUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-green-500">({fmtSize(selectedFile.size)})</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to select a file</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, Images — max 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input type="text" className={inputCls} placeholder="Document title"
                  value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type *</label>
                  <select className={inputCls} value={uploadType}
                    onChange={e => setUploadType(e.target.value as DocType)}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {uploadType === 'Member' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Member</label>
                    <select className={inputCls} value={uploadMember ?? ''}
                      onChange={e => setUploadMember(e.target.value ? Number(e.target.value) : undefined)}>
                      <option value="">Select…</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setUploadModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadTitle.trim() || uploadDoc.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {uploadDoc.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><Upload className="w-4 h-4" /> Upload</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Document"
        description={`Delete "${deleteTarget?.title}"? The file will be permanently removed.`}
        confirmLabel="Delete" loading={deleteDoc.isPending}
        onConfirm={() => deleteDoc.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
