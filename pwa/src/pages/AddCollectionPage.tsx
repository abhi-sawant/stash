import * as LucideIcons from 'lucide-react'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ModalPage from '../components/ModalPage'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useBookmarks } from '../lib/context'
import { COLLECTION_COLORS, COLLECTION_ICONS, getColors, spacing } from '../lib/theme'

// Map COLLECTION_ICONS names to Lucide component names
const ICON_MAP: Record<string, string> = {
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

function IconPreview({ name, size, color }: { name: string; size: number; color: string }) {
  const lucideName = ICON_MAP[name] ?? 'Folder'
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[
    lucideName
  ]
  return Icon ? <Icon size={size} color={color} /> : <LucideIcons.Folder size={size} color={color} />
}

export default function AddCollectionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { addCollection, updateCollection, collections } = useBookmarks()

  const editId = searchParams.get('edit')
  const parentIdParam = searchParams.get('parentId')
  const existingCollection = editId ? collections.find((c) => c.id === editId) : undefined
  const isEditing = !!existingCollection

  const [name, setName] = useState(existingCollection?.name ?? '')
  const [selectedColor, setSelectedColor] = useState(existingCollection?.color ?? COLLECTION_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(existingCollection?.icon ?? COLLECTION_ICONS[0])
  const [selectedParent, setSelectedParent] = useState<string | null>(
    existingCollection?.parentId ?? parentIdParam ?? null,
  )
  const [saving, setSaving] = useState(false)

  const rootCollections = collections.filter((c) => !c.parentId && c.id !== editId)

  const handleSave = () => {
    if (!name.trim()) return
    setSaving(true)
    if (isEditing && existingCollection) {
      updateCollection({
        id: existingCollection.id,
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        parentId: selectedParent ?? undefined,
      })
    } else {
      addCollection({
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        parentId: selectedParent ?? undefined,
      })
    }
    navigate(-1)
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    display: 'block',
  } as const

  return (
    <ModalPage
      title={isEditing ? 'Edit Collection' : 'New Collection'}
      onClose={() => navigate(-1)}
      onSave={handleSave}
      saveLabel={isEditing ? 'Update' : 'Create'}
      saveDisabled={saving || !name.trim()}
      colors={colors}>
      {/* Preview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          padding: `${spacing.xl}px 0`,
        }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: `${selectedColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <IconPreview name={selectedIcon} size={36} color={selectedColor} />
        </div>
        <div style={{ width: 4, height: 60, borderRadius: 2, background: selectedColor }} />
      </div>

      {/* Name */}
      <label style={labelStyle}>Collection Name</label>
      <input
        type='text'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='e.g. Work, Reading, Recipes...'
        autoFocus
        style={{
          width: '100%',
          padding: '10px 12px',
          background: colors.inputBg,
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: 12,
          fontSize: 15,
          color: colors.text,
        }}
      />

      {/* Color picker */}
      <label style={labelStyle}>Color</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {COLLECTION_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: selectedColor === color ? '3px solid rgba(255,255,255,0.8)' : '3px solid transparent',
              outline: selectedColor === color ? `2px solid ${color}` : 'none',
              boxSizing: 'border-box',
            }}>
            {selectedColor === color && <Check size={16} color='#fff' />}
          </button>
        ))}
      </div>

      {/* Icon picker */}
      <label style={labelStyle}>Icon</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {COLLECTION_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => setSelectedIcon(icon)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: selectedIcon === icon ? `${selectedColor}20` : colors.surfaceVariant,
              border: `2px solid ${selectedIcon === icon ? selectedColor : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IconPreview name={icon} size={22} color={selectedIcon === icon ? selectedColor : colors.textSecondary} />
          </button>
        ))}
      </div>

      {/* Parent collection */}
      {rootCollections.length > 0 && (
        <>
          <label style={labelStyle}>Parent Collection (optional)</label>
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
            <button
              onClick={() => setSelectedParent(null)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                color: colors.textSecondary,
                borderBottom: `1px solid ${colors.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              None
              {!selectedParent && <Check size={16} color={colors.primary} />}
            </button>
            {rootCollections.map((col) => (
              <button
                key={col.id}
                onClick={() => setSelectedParent(col.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  color: colors.text,
                  borderBottom: `1px solid ${colors.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: col.color, flexShrink: 0 }} />
                  {col.name}
                </div>
                {selectedParent === col.id && <Check size={16} color={colors.primary} />}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 40 }} />
    </ModalPage>
  )
}
