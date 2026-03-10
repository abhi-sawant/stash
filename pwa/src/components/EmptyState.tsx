import type { LucideIcon } from 'lucide-react'
import type { AppColors } from '../lib/theme'

interface Props {
  icon: LucideIcon
  title: string
  subtitle: string
  colors: AppColors
}

export default function EmptyState({ icon: Icon, title, subtitle, colors }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        gap: 12,
        textAlign: 'center',
      }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          background: colors.primaryContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={32} color={colors.primary} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>{title}</p>
      <p style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 240 }}>{subtitle}</p>
    </div>
  )
}
