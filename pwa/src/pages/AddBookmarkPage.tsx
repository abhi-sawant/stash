import { Clipboard, Folder, Link2, Tag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ModalPage from '../components/ModalPage'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useBookmarks } from '../lib/context'
import { getColors, getTagColor, spacing } from '../lib/theme'
import { fetchUrlMetadata, getFaviconUrl, normalizeUrl } from '../lib/utils'

export default function AddBookmarkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { addBookmark, collections } = useBookmarks()

  const initialUrl = searchParams.get('url') ?? ''
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | undefined>()
  const [faviconUri, setFaviconUri] = useState<string | undefined>()
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const initialFetched = useRef(false)
  useEffect(() => {
    if (initialUrl && !initialFetched.current) {
      initialFetched.current = true
      handleFetchMeta(initialUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFetchMeta = async (urlToFetch?: string) => {
    const target = normalizeUrl(urlToFetch ?? url)
    if (!target) return
    setFetchingMeta(true)
    try {
      const meta = await fetchUrlMetadata(target)
      if (meta.title) setTitle(meta.title)
      if (meta.description) setSubtitle(meta.description)
      if (meta.imageUrl) setImageUri(meta.imageUrl)
      if (meta.faviconUrl) setFaviconUri(meta.faviconUrl)
      setUrl(target)
    } catch {
      /* silent */
    } finally {
      setFetchingMeta(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text)
        handleFetchMeta(text)
      }
    } catch {
      /* clipboard permission denied */
    }
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
    addBookmark({
      url: normalized,
      title: title.trim() || normalized,
      subtitle: subtitle.trim(),
      tags,
      collectionId: selectedCollection ?? undefined,
      imageUri,
      faviconUri: faviconUri || getFaviconUrl(normalized),
    })
    navigate(-1)
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
      title='Add Bookmark'
      onClose={() => navigate(-1)}
      onSave={handleSave}
      saveDisabled={saving || !url.trim()}
      colors={colors}>
      {/* URL */}
      <label style={labelStyle}>URL</label>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: colors.inputBg,
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: 12,
          padding: '4px 8px 4px 12px',
        }}>
        <Link2 size={16} color={colors.textTertiary} style={{ flexShrink: 0 }} />
        <input
          type='url'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetchMeta()}
          placeholder='https://example.com'
          style={{ flex: 1, fontSize: 15, color: colors.text, background: 'transparent', padding: '8px 0' }}
        />
        <button onClick={handlePaste} style={{ display: 'flex', padding: 6, color: colors.primary }}>
          <Clipboard size={16} />
        </button>
        <button
          onClick={() => handleFetchMeta()}
          disabled={fetchingMeta || !url.trim()}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: colors.primaryContainer,
            color: colors.primary,
            fontSize: 13,
            fontWeight: 600,
            opacity: !url.trim() ? 0.5 : 1,
          }}>
          {fetchingMeta ? '...' : 'Fetch'}
        </button>
      </div>

      {/* Image preview */}
      {imageUri && (
        <div style={{ position: 'relative', marginTop: spacing.xl }}>
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
        placeholder='Optional description'
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
