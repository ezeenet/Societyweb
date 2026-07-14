// ─────────────────────────────────────────────────────────────────────────────
// lib/api/client.ts
// Configured Axios instance.
//
// Interceptors handle:
//   - Attaching the Bearer access token on every request
//   - Catching 401 responses → silently calling /auth/refresh → retrying
//   - Redirecting to /login when refresh also fails
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,         // Send httpOnly refresh cookie automatically
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

// ── Request interceptor — attach access token ────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 with silent refresh ───────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Queues requests that arrived while a refresh was in progress
const subscribeToRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const notifySubscribers = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // If 401 from an auth endpoint, go straight to login
    if (is401 && isAuthEndpoint) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (is401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve) => {
          subscribeToRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh');
        const newToken: string = data.data.accessToken;

        useAuthStore.getState().setAccessToken(newToken);
        notifySubscribers(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export default apiClient;
