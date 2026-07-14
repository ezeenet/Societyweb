'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Building2, Shield, BarChart3, Users, Bell, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/lib/store/authStore';
import type { Role } from '@/types/auth.types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ROLE_REDIRECT: Record<Role, string> = {
  ADMIN:      '/dashboard',
  MANAGER:    '/dashboard',
  ACCOUNTANT: '/accounts',
  SECURITY:   '/visitors',
  MEMBER:     '/maintenance',
};

const FEATURES = [
  { icon: Building2, title: 'Property Management',  desc: 'Manage wings, flats, and members in one place' },
  { icon: BarChart3, title: 'Financial Tracking',   desc: 'Maintenance billing, receipts, and full accounting' },
  { icon: Users,     title: 'Visitor Tracking',     desc: 'Real-time entry and exit log for security' },
  { icon: Bell,      title: 'Notices & Polls',      desc: 'Communicate and collect feedback from members' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } =
    useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
  if (isAuthenticated && user) {
    const redirectTo = ROLE_REDIRECT[user.role] ?? '/dashboard';
    router.replace(redirectTo);
  }
}, [isAuthenticated, user]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authData = await authApi.login(values);

      setAuth(
        {
          username: authData.username,
          fullName: authData.fullName,
          role:     authData.role,
          memberId: authData.memberId,
        },
        authData.accessToken
      );

      toast.success(`Welcome back, ${authData.fullName}!`);

      const redirectTo = ROLE_REDIRECT[authData.role] ?? '/dashboard';
      window.location.href = redirectTo;

    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      if (apiErr?.code === 'INVALID_CREDENTIALS') {
        setError('password', { message: 'Incorrect username or password' });
      } else if (apiErr?.code === 'ACCOUNT_DISABLED') {
        toast.error('Your account has been deactivated. Contact the administrator.');
      } else {
        toast.error('Unable to connect. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
           style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 75%, #60a5fa 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
               style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-10"
               style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">SocietyMS</p>
              <p className="text-blue-200 text-xs">by ADITYA INFOTECH</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Society<br />
            <span className="text-blue-200">Management,</span><br />
            Simplified.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            One platform for billing, complaints, notices, accounts, and everything your housing society needs.
          </p>
          <div className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-300 text-xs">
            &copy; {new Date().getFullYear()} ADITYA INFOTECH, Akola &mdash; All rights reserved
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-xl text-slate-800">SocietyMS</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-8 shadow-xl"
               style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1.5">Sign in to access your society portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input
                  id="username" type="text" autoComplete="username" autoFocus
                  placeholder="Enter your username"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.username ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`}
                  {...register('username')}
                />
                {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.password ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`}
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all outline-none mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow:  isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
                }}>
                {isLoading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in…</span>
                  : 'Sign In'}
              </button>

            </form>

            <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium text-center">
                Default: <span className="font-mono">admin</span> / <span className="font-mono">Admin@123</span>
              </p>
              <p className="text-xs text-blue-400 text-center mt-0.5">Change your password after first login</p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            SocietyMS v2.0 &mdash; ADITYA INFOTECH, Akola
          </p>
        </div>
      </div>

    </div>
  );
}
