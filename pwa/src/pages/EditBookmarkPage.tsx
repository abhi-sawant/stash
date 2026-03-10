import { ExternalLink, Folder, Link2, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ModalPage from '../components/ModalPage'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useBookmarks } from '../lib/context'
import { getColors, getTagColor, spacing } from '../lib/theme'
import { formatDate, normalizeUrl } from '../lib/utils'

export default function EditBookmarkPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, updateBookmark, deleteBookmark } = useBookmarks()

  const bookmark = bookmarks.find((b) => b.id === id)

  const [url, setUrl] = useState(bookmark?.url ?? '')
  const [title, setTitle] = useState(bookmark?.title ?? '')
  const [subtitle, setSubtitle] = useState(bookmark?.subtitle ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(bookmark?.tags ?? [])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(bookmark?.collectionId ?? null)
  const [imageUri, setImageUri] = useState<string | undefined>(bookmark?.imageUri)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!bookmark) {
    navigate(-1)
    return null
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const handleSave = () => {
    const normalized = normalizeUrl(url)
    if (!normalized) {
      alert('Please enter a valid URL')
      return
    }
    setSaving(true)
    updateBookmark({
      id: bookmark.id,
      url: normalized,
      title: title.trim() || normalized,
      subtitle: subtitle.trim(),
      tags,
      collectionId: selectedCollection ?? undefined,
      imageUri,
    })
    navigate(-1)
  }

  const handleDelete = () => {
    if (confirm(`Delete "${bookmark.title}"? This cannot be undone.`)) {
      deleteBookmark(bookmark.id)
      navigate(-1)
    }
  }

  const selectedCol = collections.find((c) => c.id === selectedCollection)

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 12,
    fontSize: 15,
    color: colors.text,
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    display: 'block',
  }

  return (
    <ModalPage
      title='Edit Bookmark'
      onClose={() => navigate(-1)}
      onSave={handleSave}
      saveDisabled={saving}
      colors={colors}>
      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: spacing.md }}>
        <a
          href={bookmark.url}
          target='_blank'
          rel='noopener noreferrer'
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 12,
            background: colors.primaryContainer,
            color: colors.primary,
            fontSize: 14,
            fontWeight: 500,
          }}>
          <ExternalLink size={16} />
          Open Link
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(bookmark.url)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 12,
            background: colors.primaryContainer,
            color: colors.primary,
            fontSize: 14,
            fontWeight: 500,
          }}>
          <Link2 size={16} />
          Copy URL
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 12,
            background: colors.errorContainer,
            color: colors.error,
            fontSize: 14,
            fontWeight: 500,
          }}>
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <p style={{ fontSize: 12, color: colors.textTertiary, marginBottom: spacing.md }}>
        Added {formatDate(bookmark.createdAt)}
      </p>

      {/* Image preview */}
      {imageUri && (
        <div style={{ position: 'relative', marginBottom: spacing.md }}>
          <img src={imageUri} alt='' style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
          <button
            onClick={() => setImageUri(undefined)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* URL */}
      <label style={labelStyle}>URL</label>
      <input type='url' value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} />

      {/* Title */}
      <label style={labelStyle}>Title</label>
      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Page title'
        style={inputStyle}
      />

      {/* Description */}
      <label style={labelStyle}>Description</label>
      <textarea
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: '20px' }}
      />

      {/* Tags */}
      <label style={labelStyle}>Tags</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            gap: 8,
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 12,
            padding: '4px 8px 4px 12px',
          }}>
          <Tag size={14} color={colors.textTertiary} />
          <input
            type='text'
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())}
            placeholder='add tag, press Enter'
            style={{ flex: 1, fontSize: 14, color: colors.text, background: 'transparent', padding: '8px 0' }}
          />
        </div>
        <button
          onClick={addTag}
          disabled={!tagInput.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 12,
            background: colors.primaryContainer,
            color: colors.primary,
            fontWeight: 600,
            opacity: !tagInput.trim() ? 0.5 : 1,
          }}>
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {tags.map((tag) => {
            const tc = getTagColor(tag)
            return (
              <span
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: tc.bg,
                  color: tc.text,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 9999,
                }}>
                #{tag}
                <button
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  style={{ color: tc.text, display: 'flex' }}>
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Collection */}
      {collections.length > 0 && (
        <>
          <label style={labelStyle}>Collection</label>
          <button
            onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 12,
              padding: '10px 12px',
              color: selectedCol ? colors.text : colors.textTertiary,
              fontSize: 15,
            }}>
            <Folder size={16} color={selectedCol ? selectedCol.color : colors.textTertiary} />
            {selectedCol ? selectedCol.name : 'Select a collection (optional)'}
          </button>
          {showCollectionPicker && (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: 12,
                marginTop: 4,
                overflow: 'hidden',
              }}>
              <button
                onClick={() => {
                  setSelectedCollection(null)
                  setShowCollectionPicker(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  color: colors.textSecondary,
                  borderBottom: `1px solid ${colors.divider}`,
                }}>
                None
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    setSelectedCollection(col.id)
                    setShowCollectionPicker(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 14,
                    color: colors.text,
                    borderBottom: `1px solid ${colors.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: selectedCollection === col.id ? `${col.color}12` : 'transparent',
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: col.color, flexShrink: 0 }} />
                  {col.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ height: 40 }} />
    </ModalPage>
  )
}
