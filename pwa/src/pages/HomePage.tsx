import { Bookmark as BookmarkIcon, ChevronUp, Plus } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookmarkCard from '../components/BookmarkCard'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import SearchBar, { FilterChip, FilterRow } from '../components/SearchBar'
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

export default function HomePage() {
  const navigate = useNavigate()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, deleteBookmark, getAllTags } = useBookmarks()

  const [query, setQuery] = useState('')
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const allTags = getAllTags()
  const numColumns = getColumnCount()

  const filtered = bookmarks.filter((b) => {
    if (activeCollectionId && b.collectionId !== activeCollectionId) return false
    if (activeTag && !b.tags.includes(activeTag)) return false
    if (query) return searchFilter(query, b.title, b.subtitle, b.url, ...b.tags)
    return true
  })

  const columns = buildColumns(filtered, numColumns)

  const getCollection = useCallback(
    (id?: string): Collection | undefined => collections.find((c) => c.id === id),
    [collections],
  )

  const handleScroll = () => {
    if (scrollRef.current) setShowScrollTop(scrollRef.current.scrollTop > 200)
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const confirmDelete = (bookmark: Bookmark) => {
    if (confirm(`Delete "${bookmark.title || bookmark.url}"?`)) {
      deleteBookmark(bookmark.id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      {/* Header */}
      <div
        style={{
          padding: `${spacing.md}px ${spacing.lg}px ${spacing.sm}px`,
          background: colors.background,
          flexShrink: 0,
        }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.primary }}>Stash</h1>
            <p style={{ fontSize: 12, color: colors.textSecondary }}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'link' : 'links'}
            </p>
          </div>
          <button
            onClick={() => navigate('/bookmark/add')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: colors.primaryContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
              WebkitTapHighlightColor: 'transparent',
            }}>
            <Plus size={22} />
          </button>
        </div>

        <SearchBar value={query} onChange={setQuery} colors={colors} />

        {collections.length > 0 && (
          <FilterRow>
            <FilterChip
              label='All'
              active={!activeCollectionId && !activeTag}
              onPress={() => {
                setActiveCollectionId(null)
                setActiveTag(null)
              }}
              colors={colors}
            />
            {collections.map((col) => (
              <FilterChip
                key={col.id}
                label={col.name}
                active={activeCollectionId === col.id}
                onPress={() => {
                  setActiveCollectionId(activeCollectionId === col.id ? null : col.id)
                  setActiveTag(null)
                }}
                colors={colors}
              />
            ))}
          </FilterRow>
        )}

        {allTags.length > 0 && (
          <FilterRow>
            {allTags.map((tag) => (
              <FilterChip
                key={tag}
                label={`#${tag}`}
                active={activeTag === tag}
                onPress={() => {
                  setActiveTag(activeTag === tag ? null : tag)
                  setActiveCollectionId(null)
                }}
                colors={colors}
              />
            ))}
          </FilterRow>
        )}
      </div>

      {/* Masonry grid */}
      {filtered.length === 0 ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <EmptyState
            icon={BookmarkIcon}
            title={query || activeCollectionId || activeTag ? 'No matches found' : 'No bookmarks yet'}
            subtitle={
              query || activeCollectionId || activeTag
                ? 'Try a different search or filter'
                : 'Tap + to save your first link'
            }
            colors={colors}
          />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className='page-scroll'
          onScroll={handleScroll}
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
        <FAB icon={ChevronUp} onPress={scrollToTop} colors={colors} />
      ) : (
        <FAB icon={Plus} onPress={() => navigate('/bookmark/add')} colors={colors} />
      )}
    </div>
  )
}
