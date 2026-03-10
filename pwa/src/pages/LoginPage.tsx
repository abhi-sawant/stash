import { ArrowLeft, Bookmark, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useAuth } from '../lib/auth-context'
import { getColors, spacing } from '../lib/theme'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/auth/otp')
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 12,
    padding: '12px 14px',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.background,
        overflowY: 'auto',
      }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          margin: `${spacing.lg}px ${spacing.lg}px 0`,
          display: 'flex',
          color: colors.text,
          alignSelf: 'flex-start',
          padding: 4,
        }}>
        <ArrowLeft size={24} />
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: spacing.lg }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: colors.primaryContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
            <Bookmark size={32} color={colors.primary} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
            Sign in to enable automatic cloud backups
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 20,
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
          }}>
          {/* Email */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>Email</p>
            <div style={inputRowStyle}>
              <Mail size={18} color={colors.textTertiary} />
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                autoComplete='email'
                style={{ flex: 1, fontSize: 15, color: colors.text, background: 'transparent' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>Password</p>
            <div style={inputRowStyle}>
              <Lock size={18} color={colors.textTertiary} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder='••••••••'
                autoComplete='current-password'
                style={{ flex: 1, fontSize: 15, color: colors.text, background: 'transparent' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: colors.textTertiary, display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: colors.errorContainer, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: colors.error }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: colors.primary,
              color: colors.textOnPrimary,
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Sending OTP...' : 'Sign In'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginTop: spacing.xl }}>
          Don't have an account?{' '}
          <Link to='/auth/register' style={{ color: colors.primary, fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
