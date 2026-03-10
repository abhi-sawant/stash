import type { LucideIcon } from 'lucide-react'
import type { AppColors } from '../lib/theme'

interface Props {
  icon: LucideIcon
  onPress: () => void
  colors: AppColors
}

export default function FAB({ icon: Icon, onPress, colors }: Props) {
  return (
    <button
      onClick={onPress}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        background: colors.fab,
        color: colors.fabText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 16px ${colors.shadow}`,
        border: 'none',
        cursor: 'pointer',
        zIndex: 10,
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.1s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
      <Icon size={24} />
    </button>
  )
}
