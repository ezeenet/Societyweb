'use client';
// app/(dashboard)/settings/page.tsx

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, CreditCard, Landmark, Calendar,
  Upload, Loader2, Check, Image, Mail,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useSettings, useUpdateSettings, useUploadLogo } from '@/lib/hooks/useAdmin';

const schema = z.object({
  societyName:                 z.string().max(200).optional().or(z.literal('')),
  registrationNo:              z.string().max(100).optional().or(z.literal('')),
  address:                     z.string().optional().or(z.literal('')),
  city:                        z.string().max(100).optional().or(z.literal('')),
  state:                       z.string().max(100).optional().or(z.literal('')),
  pincode:                     z.string().max(10).optional().or(z.literal('')),
  contactPhone:                z.string().max(15).optional().or(z.literal('')),
  contactEmail:                z.string().email().optional().or(z.literal('')),
  website:                     z.string().max(200).optional().or(z.literal('')),
  defaultMaintenanceAmount:    z.coerce.number().positive().optional(),
  maintenanceDueDayOfMonth:    z.coerce.number().min(1).max(28).optional(),
  lateFineAmount:              z.coerce.number().min(0).optional(),
  lateFineDaysAfterDue:        z.coerce.number().min(0).optional(),
  bankName:                    z.string().max(200).optional().or(z.literal('')),
  bankAccountNo:               z.string().max(50).optional().or(z.literal('')),
  bankIfscCode:                z.string().max(20).optional().or(z.literal('')),
  bankBranch:                  z.string().max(200).optional().or(z.literal('')),
  financialYearStart:          z.string().max(10).optional().or(z.literal('')),
  currency:                    z.string().max(10).optional().or(z.literal('')),
  reminderEmailSubject:        z.string().max(200).optional().or(z.literal('')),
  reminderEmailBody:           z.string().optional().or(z.literal('')),
  emailUsername:               z.string().max(200).optional().or(z.literal('')),
  emailPassword:               z.string().max(200).optional().or(z.literal('')),
});

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

type Section = { id: string; label: string; icon: React.ElementType };

const SECTIONS: Section[] = [
  { id: 'society',     label: 'Society Info',       icon: Building2  },
  { id: 'maintenance', label: 'Maintenance Config', icon: CreditCard },
  { id: 'bank',        label: 'Bank Details',       icon: Landmark   },
  { id: 'system',      label: 'Financial Year',     icon: Calendar   },
  { id: 'email',       label: 'Email Template',     icon: Mail       },
  { id: 'emailconfig', label: 'Email Config',        icon: Mail       },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadLogo     = useUploadLogo();
  const logoInputRef   = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState('society');
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) {
      reset({
        societyName:              settings.societyName ?? '',
        registrationNo:           settings.registrationNo ?? '',
        address:                  settings.address ?? '',
        city:                     settings.city ?? '',
        state:                    settings.state ?? '',
        pincode:                  settings.pincode ?? '',
        contactPhone:             settings.contactPhone ?? '',
        contactEmail:             settings.contactEmail ?? '',
        website:                  settings.website ?? '',
        defaultMaintenanceAmount: settings.defaultMaintenanceAmount,
        maintenanceDueDayOfMonth: settings.maintenanceDueDayOfMonth,
        lateFineAmount:           settings.lateFineAmount,
        lateFineDaysAfterDue:     settings.lateFineDaysAfterDue,
        bankName:                 settings.bankName ?? '',
        bankAccountNo:            settings.bankAccountNo ?? '',
        bankIfscCode:             settings.bankIfscCode ?? '',
        bankBranch:               settings.bankBranch ?? '',
        financialYearStart:       settings.financialYearStart,
        currency:                 settings.currency,
        reminderEmailSubject:     settings.reminderEmailSubject ?? '',
        reminderEmailBody:        settings.reminderEmailBody ?? '',
        emailUsername:            settings.emailUsername ?? '',
        emailPassword:            '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (values: any) => {
    updateSettings.mutate(values, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  const SectionTab = ({ section }: { section: Section }) => {
    const Icon = section.icon;
    return (
      <button type="button" onClick={() => setActiveSection(section.id)}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left w-full
          ${activeSection === section.id
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {section.label}
      </button>
    );
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Settings"
        subtitle="Society configuration, maintenance rules, and system preferences"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-6">

          {/* Left: Section navigation */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-1 sticky top-6">
              {SECTIONS.map(s => <SectionTab key={s.id} section={s} />)}
            </div>
          </div>

          {/* Right: Section content */}
          <div className="flex-1 min-w-0">

            {/* Section 1: Society Info */}
            {activeSection === 'society' && (
              <SectionCard title="Society Info" subtitle="Basic details and contact information">
                {/* Logo */}
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
                    {settings?.logoPath ? (
                      <img src={settings.logoPath} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Society Logo</p>
                    <p className="text-xs text-slate-400 mb-2">PNG or JPG, max 2MB</p>
                    <button type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadLogo.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50">
                      {uploadLogo.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Upload className="w-3.5 h-3.5" />}
                      {uploadLogo.isPending ? 'Uploading…' : 'Upload Logo'}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={handleLogoChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Society Name">
                    <input type="text" className={inputCls} {...register('societyName')} />
                  </Field>
                  <Field label="Registration No.">
                    <input type="text" className={inputCls} {...register('registrationNo')} />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea rows={2} className={`${inputCls} resize-none`} {...register('address')} />
                </Field>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="City">
                    <input type="text" className={inputCls} {...register('city')} />
                  </Field>
                  <Field label="State">
                    <input type="text" className={inputCls} {...register('state')} />
                  </Field>
                  <Field label="Pincode">
                    <input type="text" className={inputCls} maxLength={6} {...register('pincode')} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contact Phone">
                    <input type="tel" className={inputCls} {...register('contactPhone')} />
                  </Field>
                  <Field label="Contact Email">
                    <input type="email" className={inputCls} {...register('contactEmail')} />
                  </Field>
                </div>
                <Field label="Website">
                  <input type="url" className={inputCls} placeholder="https://" {...register('website')} />
                </Field>
              </SectionCard>
            )}

            {/* Section 2: Maintenance Config */}
            {activeSection === 'maintenance' && (
              <SectionCard title="Maintenance Configuration" subtitle="Default billing rules applied when generating bills">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default Amount per Flat (₹)">
                    <input type="number" step="0.01" min="0" className={inputCls}
                      {...register('defaultMaintenanceAmount')} />
                  </Field>
                  <Field label="Due Day of Month">
                    <input type="number" min="1" max="28" className={inputCls}
                      {...register('maintenanceDueDayOfMonth')} />
                  </Field>
                  <Field label="Late Fine Amount (₹)">
                    <input type="number" step="0.01" min="0" className={inputCls}
                      {...register('lateFineAmount')} />
                  </Field>
                  <Field label="Apply Late Fine After (days)">
                    <input type="number" min="0" className={inputCls}
                      {...register('lateFineDaysAfterDue')} />
                  </Field>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600">
                    These defaults are used when generating bills. Each bill can still be overridden manually from the Maintenance module.
                  </p>
                </div>
              </SectionCard>
            )}

            {/* Section 3: Bank Details */}
            {activeSection === 'bank' && (
              <SectionCard title="Bank Details" subtitle="Society bank account shown on receipts and reports">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name">
                    <input type="text" className={inputCls} placeholder="e.g. State Bank of India" {...register('bankName')} />
                  </Field>
                  <Field label="Account Number">
                    <input type="text" className={inputCls} {...register('bankAccountNo')} />
                  </Field>
                  <Field label="IFSC Code">
                    <input type="text" className={inputCls} placeholder="e.g. SBIN0001234" {...register('bankIfscCode')} />
                  </Field>
                  <Field label="Branch">
                    <input type="text" className={inputCls} {...register('bankBranch')} />
                  </Field>
                </div>
              </SectionCard>
            )}

            {/* Section 4: Financial Year */}
            {activeSection === 'system' && (
              <SectionCard title="Financial Year & System" subtitle="Accounting year boundaries and currency">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Financial Year Start (dd-MM)">
                    <input type="text" className={inputCls} placeholder="01-04" maxLength={5}
                      {...register('financialYearStart')} />
                    <p className="text-xs text-slate-400 mt-1">Format: dd-MM (default: 01-04 = April 1st)</p>
                  </Field>
                  <Field label="Currency">
                    <select className={inputCls} {...register('currency')}>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                    </select>
                  </Field>
                </div>
              </SectionCard>
            )}

            {/* Section 5: Email Template */}
            {activeSection === 'email' && (
              <SectionCard title="Email Reminder Template" subtitle="Customize the email sent when you click Remind on a defaulter">
                <Field label="Subject">
                  <input type="text" className={inputCls} {...register('reminderEmailSubject')} />
                </Field>
                <Field label="Body">
                  <textarea rows={8} className={`${inputCls} resize-none`} {...register('reminderEmailBody')} />
                  <p className="text-xs text-slate-400 mt-1">
                    Placeholders: <code className="px-1 bg-slate-100 rounded">{'{memberName}'}</code> and <code className="px-1 bg-slate-100 rounded">{'{amountDue}'}</code> will be replaced automatically.
                  </p>
                </Field>
              </SectionCard>
            )}

            {/* Section 6: Email Config */}
            {activeSection === 'emailconfig' && (
              <SectionCard title="Email Configuration" subtitle="Gmail credentials used to send reminder emails">
                <Field label="Gmail Address">
                  <input type="email" className={inputCls} placeholder="yourname@gmail.com" {...register('emailUsername')} />
                </Field>
                <Field label="App Password">
                  <input type="password" autoComplete="new-password" className={inputCls} placeholder="Leave blank to keep existing password" {...register('emailPassword')} />
                  <p className="text-xs text-slate-400 mt-1">
                    Use Gmail App Password (16 characters, no spaces). Generate at myaccount.google.com/apppasswords
                  </p>
                </Field>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-700">
                    Note: These credentials are stored as plain text. Encryption will be added before production deployment.
                  </p>
                </div>
              </SectionCard>
            )}

            {/* Save button */}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={updateSettings.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                {updateSettings.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : saved
                  ? <><Check className="w-4 h-4" /> Saved!</>
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
