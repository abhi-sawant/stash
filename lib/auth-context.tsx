import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'
import {
    StoredUser,
    clearAuthToken,
    clearAuthUser,
    getAuthToken,
    getAuthUser,
    saveAuthToken,
    saveAuthUser,
} from './auth-storage'

// ─── Types ────────────────────────────────────────────────────────────────

interface AuthState {
  user: StoredUser | null
  token: string | null
  /** True while we're checking stored credentials on app start. */
  loading: boolean
  /**
   * Set after calling login() or register(). Holds the email address that is
   * waiting for OTP verification. Cleared after verifyOtp() succeeds.
   */
  pendingEmail: string | null
}

interface AuthContextValue extends AuthState {
  /** Validates credentials and sends an OTP email. Navigate to OTP screen after this. */
  login: (email: string, password: string) => Promise<void>
  /** Creates an account and sends an OTP email. Navigate to OTP screen after this. */
  register: (email: string, password: string) => Promise<void>
  /** Submits the OTP code. On success the user is fully logged in. */
  verifyOtp: (email: string, otp: string) => Promise<void>
  /** Sends a new OTP to the given email address. */
  resendOtp: (email: string) => Promise<void>
  /** Clears the session — user returns to a logged-out state. */
  logout: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Restore session from storage on app launch
  useEffect(() => {
    ;(async () => {
      const savedToken = await getAuthToken()
      const savedUser = await getAuthUser()
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(savedUser)
      }
      setLoading(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await api.auth.login(email, password)
    setPendingEmail(email)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    await api.auth.register(email, password)
    setPendingEmail(email)
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const result = await api.auth.verifyOtp(email, otp)
    await saveAuthToken(result.token)
    await saveAuthUser(result.user)
    setToken(result.token)
    setUser(result.user)
    setPendingEmail(null)
  }, [])

  const resendOtp = useCallback(async (email: string) => {
    await api.auth.resendOtp(email)
  }, [])

  const logout = useCallback(async () => {
    await clearAuthToken()
    await clearAuthUser()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, pendingEmail, login, register, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
