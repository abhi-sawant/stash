import { Search, X } from 'lucide-react'
import type { AppColors } from '../lib/theme'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  colors: AppColors
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', autoFocus = false, colors }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: colors.inputBg,
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: 12,
        padding: '8px 12px',
      }}>
      <Search size={16} color={colors.textTertiary} style={{ flexShrink: 0 }} />
      <input
        type='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.text,
          background: 'transparent',
        }}
      />
      {value ? (
        <button onClick={() => onChange('')} style={{ color: colors.textTertiary, display: 'flex' }}>
          <X size={16} />
        </button>
      ) : null}
    </div>
  )
}

interface ChipProps {
  label: string
  active: boolean
  onPress: () => void
  colors: AppColors
}

export function FilterChip({ label, active, onPress, colors }: ChipProps) {
  return (
    <button
      onClick={onPress}
      style={{
        padding: '5px 12px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        background: active ? colors.chipActive : colors.chip,
        color: active ? colors.chipActiveText : colors.chipText,
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}>
      {label}
    </button>
  )
}

export function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
      {children}
    </div>
  )
}
