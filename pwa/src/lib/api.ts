import { getAuthToken } from './auth-storage'

// In development, requests go through the Vite proxy to avoid CORS.
// In production, requests go directly to the API.
export const API_BASE_URL = import.meta.env.DEV ? '' : 'https://api.stash.slowatcoding.com'

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({ error: 'Invalid response from server' }))

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed with status ${response.status}`)
  }

  return data as T
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

    login: (email: string, password: string) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    verifyOtp: (email: string, otp: string) =>
      request<{ token: string; user: { id: number; email: string } }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    resendOtp: (email: string) => request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),

    me: () => request<{ user: { id: number; email: string } }>('/api/auth/me'),
  },

  backup: {
    upload: (data: object) => request('/api/backup/upload', { method: 'POST', body: JSON.stringify({ data }) }),

    latest: () => request<{ id: number; data: unknown; size: number; created_at: string }>('/api/backup/latest'),

    list: () => request<{ backups: { id: number; size: number; created_at: string }[] }>('/api/backup/list'),
  },
}
