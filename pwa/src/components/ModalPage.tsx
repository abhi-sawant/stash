import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { AppColors } from '../lib/theme'

interface Props {
  title: string
  onClose: () => void
  onSave?: () => void
  saveLabel?: string
  saveDisabled?: boolean
  children: React.ReactNode
  colors: AppColors
}

export default function ModalPage({
  title,
  onClose,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  children,
  colors,
}: Props) {
  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: colors.background,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
      }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.divider}`,
          flexShrink: 0,
        }}>
        <button onClick={onClose} style={{ padding: 4, color: colors.text, display: 'flex', borderRadius: 8 }}>
          <X size={24} />
        </button>
        <span style={{ flex: 1, fontSize: 18, fontWeight: 600, color: colors.text }}>{title}</span>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saveDisabled}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: colors.primary,
              color: colors.textOnPrimary,
              fontSize: 14,
              fontWeight: 600,
              opacity: saveDisabled ? 0.5 : 1,
              cursor: saveDisabled ? 'not-allowed' : 'pointer',
            }}>
            {saveLabel}
          </button>
        )}
      </div>

      {/* Content */}
      <div className='page-scroll' style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  )
}
