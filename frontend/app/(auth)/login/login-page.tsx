'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const { user, setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // ── Already logged in → instant redirect (blink fix) ──
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((r) => r.startsWith('accessToken='))
      ?.split('=')[1];

    if (token && user) {
      window.location.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, [user]);

  // Show spinner while checking existing session
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post(`${API}/auth/login`, { username, password });

      // Set cookies
      const accessExp = new Date(Date.now() + 15 * 60 * 1000).toUTCString();
      const refreshExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `accessToken=${data.accessToken}; path=/; expires=${accessExp}; SameSite=Strict`;
      document.cookie = `refreshToken=${data.refreshToken}; path=/; expires=${refreshExp}; SameSite=Strict`;

      // Store in Zustand
      setAuth({
        user: {
          id: data.id,
          username: data.username,
          role: data.role,
          memberId: data.memberId ?? null,
        },
        accessToken: data.accessToken,
      });

      window.location.replace('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4 shadow-lg">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SocietyMS</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
                placeholder="Enter username"
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            ADITYA INFOTECH © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
