import { ArrowLeft, MailOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useAuth } from '../lib/auth-context'
import { useBookmarks } from '../lib/context'
import { saveBookmarks, saveCollections, saveSettings } from '../lib/storage'
import { fetchLatestBackup } from '../lib/sync'
import { getColors, spacing } from '../lib/theme'
import type { AppSettings, Bookmark, Collection } from '../lib/types'

export default function OtpPage() {
  const navigate = useNavigate()
  const { pendingEmail, verifyOtp, resendOtp } = useAuth()
  const { restore } = useBookmarks()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  // Prevent the pendingEmail→null effect from redirecting to login after
  // a successful verification (verifyOtp clears pendingEmail on success).
  const verifiedRef = useRef(false)

  useEffect(() => {
    if (!pendingEmail && !verifiedRef.current) navigate('/auth/login', { replace: true })
  }, [pendingEmail, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleVerify = async () => {
    if (!pendingEmail) return
    setError(null)
    if (otp.trim().length !== 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(pendingEmail, otp.trim())
      // Mark as verified so the pendingEmail effect doesn't redirect to login.
      verifiedRef.current = true
      try {
        const backup = await fetchLatestBackup()
        if (backup?.data) {
          const formatted = new Date(backup.created_at).toLocaleDateString()
          const shouldRestore = window.confirm(
            `A backup from ${formatted} was found on the server. Would you like to restore it?`,
          )
          if (shouldRestore) {
            const bookmarks = (backup.data.bookmarks as Bookmark[]) ?? []
            const collections = (backup.data.collections as Collection[]) ?? []
            const settings = (backup.data.settings as AppSettings) ?? { themePreference: 'system' as const }
            // Persist synchronously to localStorage before navigation so the
            // home page sees the restored data immediately.
            saveBookmarks(bookmarks)
            saveCollections(collections)
            saveSettings(settings)
            restore({ bookmarks, collections, settings })
          }
        }
      } catch {
        // Backup check failed — still navigate to app
      }
      navigate('/home', { replace: true })
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail || cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      await resendOtp(pendingEmail)
      setCooldown(60)
      setOtp('')
      inputRef.current?.focus()
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? 'Could not resend the code. Please try again.')
    } finally {
      setResending(false)
    }
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
            <MailOpen size={32} color={colors.primary} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Check your email</h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
            We sent a 6-digit code to <span style={{ color: colors.text, fontWeight: 600 }}>{pendingEmail}</span>
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
            <p style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
              Verification Code
            </p>
            <input
              ref={inputRef}
              type='text'
              inputMode='numeric'
              autoComplete='one-time-code'
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
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

          {error && (
            <div style={{ background: colors.errorContainer, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: colors.error }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
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
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {/* Resend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            marginTop: spacing.xl,
            flexWrap: 'wrap',
          }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>Didn't receive the code?</span>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{ fontSize: 14, fontWeight: 600, color: cooldown > 0 ? colors.textTertiary : colors.primary }}>
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  )
}
