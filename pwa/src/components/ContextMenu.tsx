import { MoreVertical } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import type { AppColors } from '../lib/theme'

interface Action {
  label: string
  icon: React.ReactNode
  onPress: () => void
  destructive?: boolean
}

interface Props {
  actions: Action[]
  colors: AppColors
}

export default function ContextMenu({ actions, colors }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        style={{
          display: 'flex',
          padding: 4,
          color: colors.textTertiary,
          borderRadius: 8,
          WebkitTapHighlightColor: 'transparent',
        }}>
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: '100%',
            marginBottom: 4,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            boxShadow: `0 8px 24px ${colors.shadow}`,
            minWidth: 160,
            zIndex: 100,
            overflow: 'hidden',
          }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                action.onPress()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                color: action.destructive ? colors.error : colors.text,
                borderBottom: i < actions.length - 1 ? `1px solid ${colors.divider}` : 'none',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}>
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
