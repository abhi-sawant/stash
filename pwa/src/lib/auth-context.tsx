import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'
import { clearAuthToken, clearAuthUser, getAuthToken, getAuthUser, saveAuthToken, saveAuthUser } from './auth-storage'
import type { StoredUser } from './types'

interface AuthState {
  user: StoredUser | null
  token: string | null
  loading: boolean
  pendingEmail: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = getAuthToken()
    const savedUser = getAuthUser()
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(savedUser)
    }
    setLoading(false)
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
    saveAuthToken(result.token)
    saveAuthUser(result.user)
    setToken(result.token)
    setUser(result.user)
    setPendingEmail(null)
  }, [])

  const resendOtp = useCallback(async (email: string) => {
    await api.auth.resendOtp(email)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    clearAuthUser()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, pendingEmail, login, register, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
