import { ArrowLeft, Eye, EyeOff, LockOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { api } from '../lib/api'
import { getColors, spacing } from '../lib/theme'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const otpRef = useRef<HTMLInputElement>(null)

  // Guard: redirect to forgot-password if email is missing
  useEffect(() => {
    if (!email) navigate('/auth/forgot-password', { replace: true })
  }, [email, navigate])

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleReset = async () => {
    setError(null)
    if (otp.trim().length !== 6) {
      setError('Please enter the full 6-digit reset code.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.auth.resetPassword(email, otp.trim(), password)
      navigate('/auth/login?reset=1', { replace: true })
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      await api.auth.forgotPassword(email)
      setCooldown(60)
      setOtp('')
      otpRef.current?.focus()
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? 'Could not resend the code. Please try again.')
    } finally {
      setResending(false)
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
            <LockOpen size={32} color={colors.primary} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Reset password</h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
            Enter the code we sent to <span style={{ color: colors.text, fontWeight: 600 }}>{email}</span>
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
          {/* OTP */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>Reset Code</p>
            <input
              ref={otpRef}
              type='text'
              inputMode='numeric'
              autoComplete='one-time-code'
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              placeholder='000000'
              autoFocus
              maxLength={6}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px',
                borderRadius: 12,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 16,
                textAlign: 'center',
                background: colors.inputBg,
                border: `1px solid ${otp.length > 0 ? colors.inputFocusBorder : colors.inputBorder}`,
                color: colors.text,
              }}
            />
          </div>

          {/* New password */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>New Password</p>
            <div style={inputRowStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='At least 8 characters'
                autoComplete='new-password'
                style={{ flex: 1, fontSize: 15, color: colors.text, background: 'transparent' }}
              />
              <button
                onClick={() => setShowPassword((v) => !v)}
                style={{ color: colors.textTertiary, display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
              Confirm Password
            </p>
            <div style={inputRowStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                placeholder='Re-enter your password'
                autoComplete='new-password'
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
            onClick={handleReset}
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>

        {/* Resend */}
        <p style={{ textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginTop: spacing.xl }}>
          {"Didn't receive the code? "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{
              color: cooldown > 0 ? colors.textTertiary : colors.primary,
              fontWeight: 600,
              fontSize: 14,
            }}>
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
          </button>
        </p>
      </div>
    </div>
  )
}
