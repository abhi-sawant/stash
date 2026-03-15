import { getAuthToken } from './auth-storage'

export const API_BASE_URL = 'https://api.stash.slowatcoding.com'

// ─── Generic request helper ───────────────────────────────────────────────

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  // Parse JSON response
  const data = await response.json().catch(() => ({ error: 'Invalid response from server' }))

  if (!response.ok) {
    throw new Error((data as any).error ?? `Request failed with status ${response.status}`)
  }

  return data as T
}

// ─── API methods ──────────────────────────────────────────────────────────

export const api = {
  auth: {
    /** Register a new account. Sends an OTP to the email. */
    register: (email: string, password: string) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    /** Log in with email + password. Sends an OTP to the email. */
    login: (email: string, password: string) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    /** Verify the OTP. Returns { token, user } on success. */
    verifyOtp: (email: string, otp: string) =>
      request<{ token: string; user: { id: number; email: string } }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    /** Resend a new OTP to the given email. */
    resendOtp: (email: string) =>
      request('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    /** Sends a password reset OTP to the email (if the account exists). */
    forgotPassword: (email: string) =>
      request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    /** Verifies the reset OTP and sets a new password. */
    resetPassword: (email: string, otp: string, password: string) =>
      request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password }),
      }),

    /** Returns the current user from the JWT. */
    me: () => request<{ user: { id: number; email: string } }>('/api/auth/me'),
  },

  backup: {
    /** Upload a full data backup. */
    upload: (data: object) =>
      request('/api/backup/upload', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),

    /** Get the most recent backup. Throws with "No backup found" if none exist. */
    latest: () => request<{ id: number; data: any; size: number; created_at: string }>('/api/backup/latest'),

    /** List all backup metadata (no data payload). */
    list: () => request<{ backups: { id: number; size: number; created_at: string }[] }>('/api/backup/list'),
  },
}
