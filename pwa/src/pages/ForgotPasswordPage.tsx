import { ArrowLeft, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { api } from '../lib/api'
import { getColors, spacing } from '../lib/theme'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    try {
      await api.auth.forgotPassword(trimmed)
      navigate(`/auth/reset-password?email=${encodeURIComponent(trimmed)}`)
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
  } as const

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
            <KeyRound size={32} color={colors.primary} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Forgot password?</h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
            Enter your email and we'll send you a reset code
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
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>Email</p>
            <div style={inputRowStyle}>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder='you@example.com'
                autoComplete='email'
                autoFocus
                style={{ flex: 1, fontSize: 15, color: colors.text, background: 'transparent' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: colors.errorContainer, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: colors.error }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSend}
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
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginTop: spacing.xl }}>
          Remember your password?{' '}
          <Link to='/auth/login' style={{ color: colors.primary, fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
