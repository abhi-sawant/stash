import * as LucideIcons from 'lucide-react'
import { Pencil, Trash2 } from 'lucide-react'
import type { AppColors } from '../lib/theme'
import type { Collection } from '../lib/types'
import ContextMenu from './ContextMenu'

interface Props {
  collection: Collection
  bookmarkCount: number
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  colors: AppColors
}

function CollectionIcon({ name, size, color }: { name: string; size: number; color: string }) {
  // Map from RN icon names to Lucide
  const map: Record<string, string> = {
    folder: 'Folder',
    'book-open': 'BookOpen',
    star: 'Star',
    heart: 'Heart',
    briefcase: 'Briefcase',
    'code-2': 'Code2',
    film: 'Film',
    music: 'Music',
    camera: 'Camera',
    'gamepad-2': 'Gamepad2',
    globe: 'Globe',
    'graduation-cap': 'GraduationCap',
    dumbbell: 'Dumbbell',
    'shopping-cart': 'ShoppingCart',
    plane: 'Plane',
  }
  const iconName = map[name] ?? 'Folder'
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[
    iconName
  ]
  return Icon ? <Icon size={size} color={color} /> : <LucideIcons.Folder size={size} color={color} />
}

export default function CollectionCard({ collection, bookmarkCount, onPress, onEdit, onDelete, colors }: Props) {
  return (
    <div
      onClick={onPress}
      style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.1s',
        borderLeft: `4px solid ${collection.color}`,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${collection.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <CollectionIcon name={collection.icon} size={20} color={collection.color} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 2 }}>{collection.name}</p>
            <p style={{ fontSize: 12, color: colors.textSecondary }}>
              {bookmarkCount} {bookmarkCount === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>

        <ContextMenu
          colors={colors}
          actions={[
            { label: 'Edit', icon: <Pencil size={14} />, onPress: onEdit },
            { label: 'Delete', icon: <Trash2 size={14} />, onPress: onDelete, destructive: true },
          ]}
        />
      </div>
    </div>
  )
}

export { CollectionIcon }
