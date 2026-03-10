import {
    ChevronRight,
    Cloud,
    CloudUpload,
    Download,
    LogIn,
    LogOut,
    Monitor,
    Moon,
    Sun,
    Upload,
    UserPlus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useAuth } from '../lib/auth-context'
import { useBookmarks } from '../lib/context'
import { exportAllData, importAllData } from '../lib/storage'
import { getLastSyncTime, uploadBackup } from '../lib/sync'
import type { AppColors } from '../lib/theme'
import { getColors, spacing } from '../lib/theme'
import type { AppSettings } from '../lib/types'

const THEME_OPTIONS: {
  label: string
  value: AppSettings['themePreference']
  Icon: React.ComponentType<{ size: number; color: string }>
}[] = [
  { label: 'Light', value: 'light', Icon: Sun },
  { label: 'Dark', value: 'dark', Icon: Moon },
  { label: 'System', value: 'system', Icon: Monitor },
]

function SectionHeader({ title, colors }: { title: string; colors: AppColors }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        margin: `${spacing.xl}px 0 ${spacing.sm}px`,
      }}>
      {title}
    </p>
  )
}

function SettingsCard({ children, colors }: { children: React.ReactNode; colors: AppColors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
      {children}
    </div>
  )
}

function SettingsRow({
  icon,
  iconBg,
  label,
  sublabel,
  onClick,
  chevron = true,
  labelColor,
  children,
  colors,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  sublabel?: string
  onClick?: () => void
  chevron?: boolean
  labelColor?: string
  children?: React.ReactNode
  colors: AppColors
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `12px ${spacing.lg}px`,
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: `1px solid ${colors.divider}`,
        WebkitTapHighlightColor: 'transparent',
      }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: labelColor ?? colors.text }}>{label}</p>
        {sublabel && <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{sublabel}</p>}
      </div>
      {children}
      {chevron && <ChevronRight size={16} color={colors.textTertiary} />}
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { settings, updateSettings, bookmarks, collections } = useBookmarks()
  const { user, logout } = useAuth()
  const [syncLoading, setSyncLoading] = useState(false)
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null)

  useEffect(() => {
    const ts = getLastSyncTime()
    if (ts) setLastSyncLabel(new Date(ts).toLocaleString())
  }, [])

  const handleSyncNow = async () => {
    setSyncLoading(true)
    try {
      await uploadBackup()
      const ts = getLastSyncTime()
      if (ts) setLastSyncLabel(new Date(ts).toLocaleString())
      alert('Your bookmarks have been backed up to the cloud.')
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : null) ?? 'Could not connect to the server.')
    } finally {
      setSyncLoading(false)
    }
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stash-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        importAllData(data)
        alert('Backup restored successfully. Refresh the page to see changes.')
        window.location.reload()
      } catch (err: unknown) {
        alert((err instanceof Error ? err.message : null) ?? 'Invalid or corrupted backup file.')
      }
    }
    input.click()
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) logout()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      <div className='page-scroll' style={{ padding: `${spacing.lg}px ${spacing.lg}px` }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Settings</h1>

        {/* Account */}
        <SectionHeader title='Account' colors={colors} />
        <SettingsCard colors={colors}>
          {user ? (
            <>
              <SettingsRow
                icon={<span style={{ fontSize: 18 }}>👤</span>}
                iconBg={colors.primaryContainer}
                label={user.email}
                sublabel={lastSyncLabel ? `Last synced: ${lastSyncLabel}` : 'Not synced yet'}
                chevron={false}
                colors={colors}
              />
              <SettingsRow
                icon={<CloudUpload size={18} color='#2563EB' />}
                iconBg='#DBEAFE'
                label='Sync Now'
                sublabel='Upload a backup to the cloud'
                onClick={handleSyncNow}
                colors={colors}>
                {syncLoading && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid #2563EB',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                )}
              </SettingsRow>
              <SettingsRow
                icon={<LogOut size={18} color={colors.error} />}
                iconBg={colors.errorContainer}
                label='Sign Out'
                labelColor={colors.error}
                onClick={handleLogout}
                chevron={false}
                colors={colors}
              />
            </>
          ) : (
            <>
              <SettingsRow
                icon={<Cloud size={18} color={colors.primary} />}
                iconBg={colors.primaryContainer}
                label='Cloud Backup'
                sublabel='Sign in to back up automatically'
                chevron={false}
                colors={colors}
              />
              <SettingsRow
                icon={<LogIn size={18} color={colors.primary} />}
                iconBg={colors.primaryContainer}
                label='Sign In'
                sublabel='Already have an account'
                onClick={() => navigate('/auth/login')}
                colors={colors}
              />
              <SettingsRow
                icon={<UserPlus size={18} color={colors.primary} />}
                iconBg={colors.primaryContainer}
                label='Create Account'
                sublabel='New to Stash'
                onClick={() => navigate('/auth/register')}
                colors={colors}
              />
            </>
          )}
        </SettingsCard>

        {/* Appearance */}
        <SectionHeader title='Appearance' colors={colors} />
        <SettingsCard colors={colors}>
          <div style={{ padding: spacing.lg }}>
            <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm }}>Theme</p>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {THEME_OPTIONS.map(({ label, value, Icon }) => {
                const active = settings.themePreference === value
                return (
                  <button
                    key={value}
                    onClick={() => updateSettings({ themePreference: value })}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: `2px solid ${active ? colors.primary : colors.border}`,
                      background: active ? colors.primaryContainer : colors.inputBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}>
                    <Icon size={20} color={active ? colors.primary : colors.textSecondary} />
                    <span
                      style={{ fontSize: 11, fontWeight: 500, color: active ? colors.primary : colors.textSecondary }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </SettingsCard>

        {/* Data */}
        <SectionHeader title='Data' colors={colors} />
        <SettingsCard colors={colors}>
          <SettingsRow
            icon={<Download size={18} color={colors.primary} />}
            iconBg={colors.primaryContainer}
            label='Export Backup'
            sublabel='Download a JSON backup file'
            onClick={handleExport}
            colors={colors}
          />
          <SettingsRow
            icon={<Upload size={18} color={colors.primary} />}
            iconBg={colors.primaryContainer}
            label='Import Backup'
            sublabel='Restore from a JSON backup file'
            onClick={handleImport}
            colors={colors}
          />
        </SettingsCard>

        {/* Stats */}
        <SectionHeader title='Statistics' colors={colors} />
        <SettingsCard colors={colors}>
          <div style={{ padding: spacing.lg, display: 'flex', gap: spacing.md }}>
            {[
              { num: bookmarks.length, label: 'Bookmarks' },
              { num: collections.length, label: 'Collections' },
            ].map(({ num, label }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: colors.surfaceVariant,
                  borderRadius: 12,
                  padding: '12px 8px',
                }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{num}</p>
                <p style={{ fontSize: 12, color: colors.textSecondary }}>{label}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        <div style={{ height: 40 }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
