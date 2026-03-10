import * as LucideIcons from 'lucide-react'
import { ArrowLeft, Bookmark as BookmarkIcon, ChevronUp, Pencil, Plus } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BookmarkCard from '../components/BookmarkCard'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import SearchBar from '../components/SearchBar'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useBookmarks } from '../lib/context'
import { getColors, spacing } from '../lib/theme'
import type { Bookmark, Collection } from '../lib/types'
import { searchFilter } from '../lib/utils'

function getColumnCount(): number {
  const w = window.innerWidth
  if (w >= 900) return 4
  if (w >= 600) return 3
  return 2
}

function buildColumns<T>(items: T[], numCols: number): T[][] {
  const cols: T[][] = Array.from({ length: numCols }, () => [])
  items.forEach((item, i) => cols[i % numCols].push(item))
  return cols
}

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

function ColIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[
    ICON_MAP[name] ?? 'Folder'
  ]
  return Icon ? <Icon size={size} color={color} /> : <LucideIcons.Folder size={size} color={color} />
}

export default function CollectionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, deleteBookmark } = useBookmarks()

  const [query, setQuery] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const numColumns = getColumnCount()

  const collection = collections.find((c) => c.id === id)
  const childCollectionIds = collections.filter((c) => c.parentId === id).map((c) => c.id)
  const allIds = [id!, ...childCollectionIds]

  const filtered = bookmarks.filter((b) => {
    if (!allIds.includes(b.collectionId ?? '')) return false
    if (query.trim()) return searchFilter(query, b.title, b.subtitle, b.url, ...b.tags)
    return true
  })

  const columns = buildColumns(filtered, numColumns)

  const getCollection = useCallback(
    (cid?: string): Collection | undefined => collections.find((c) => c.id === cid),
    [collections],
  )

  if (!collection) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.background,
        }}>
        <p style={{ color: colors.text }}>Collection not found</p>
        <button onClick={() => navigate(-1)} style={{ color: colors.primary, marginTop: 16 }}>
          Go back
        </button>
      </div>
    )
  }

  const confirmDelete = (bookmark: Bookmark) => {
    if (confirm(`Delete "${bookmark.title}"?`)) deleteBookmark(bookmark.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.md}px ${spacing.lg}px`,
          borderBottom: `1px solid ${colors.divider}`,
          flexShrink: 0,
        }}>
        <button onClick={() => navigate(-1)} style={{ color: colors.text, display: 'flex', padding: 4 }}>
          <ArrowLeft size={24} />
        </button>
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
          <ColIcon name={collection.icon} size={20} color={collection.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
            {collection.name}
          </p>
          <p style={{ fontSize: 12, color: colors.textSecondary }}>
            {filtered.length} {filtered.length === 1 ? 'bookmark' : 'bookmarks'}
          </p>
        </div>
        <button
          onClick={() => navigate(`/collection/add?edit=${collection.id}`)}
          style={{ color: colors.primary, display: 'flex', padding: 8, borderRadius: 8 }}>
          <Pencil size={20} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: `${spacing.sm}px ${spacing.lg}px`, flexShrink: 0 }}>
        <SearchBar value={query} onChange={setQuery} placeholder='Search in collection...' colors={colors} />
      </div>

      {/* Bookmarks */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title={query ? 'No matches' : 'Empty collection'}
          subtitle={query ? 'Try a different search' : 'Add bookmarks to this collection when saving a link'}
          colors={colors}
        />
      ) : (
        <div
          ref={scrollRef}
          className='page-scroll'
          onScroll={() => setShowScrollTop((scrollRef.current?.scrollTop ?? 0) > 200)}
          style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'flex-start' }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  collection={getCollection(bookmark.collectionId)}
                  colors={colors}
                  onPress={() => window.open(bookmark.url, '_blank')}
                  onEdit={() => navigate(`/bookmark/${bookmark.id}`)}
                  onCopyUrl={() => navigator.clipboard.writeText(bookmark.url)}
                  onDelete={() => confirmDelete(bookmark)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {showScrollTop ? (
        <FAB
          icon={ChevronUp}
          onPress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          colors={colors}
        />
      ) : (
        <FAB icon={Plus} onPress={() => navigate('/bookmark/add')} colors={colors} />
      )}
    </div>
  )
}
