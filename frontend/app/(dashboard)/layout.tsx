'use client';
// app/(dashboard)/layout.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useSettings } from '@/lib/hooks/useAdmin';
import { setSocietyName } from '@/lib/utils/printUtils';
import { subscribeToPush, isPushSubscribed } from '@/lib/hooks/usePushNotification';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings?.societyName) {
      setSocietyName(settings.societyName);
    }
  }, [settings?.societyName]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  // Push notification auto-subscribe — login नंतर एकदाच
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const trySubscribe = async () => {
      try {
        const already = await isPushSubscribed();
        if (!already) {
          await subscribeToPush();
        }
      } catch (e) {
        // Silent fail — push optional आहे
      }
    };

    // 2 seconds delay — page load होऊ दे आधी
    const timer = setTimeout(trySubscribe, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}