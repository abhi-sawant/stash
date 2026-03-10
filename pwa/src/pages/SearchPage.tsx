import { Search as SearchIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookmarkCard from '../components/BookmarkCard'
import EmptyState from '../components/EmptyState'
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

export default function SearchPage() {
  const navigate = useNavigate()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, deleteBookmark, getAllTags } = useBookmarks()

  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = getAllTags()
  const numColumns = getColumnCount()

  const hasInput = query.trim().length > 0 || activeTag !== null

  const filtered = bookmarks.filter((b) => {
    if (activeTag && !b.tags.includes(activeTag)) return false
    if (query.trim()) return searchFilter(query, b.title, b.subtitle, b.url, ...b.tags)
    return activeTag ? true : false
  })

  const columns = buildColumns(filtered, numColumns)

  const getCollection = useCallback(
    (id?: string): Collection | undefined => collections.find((c) => c.id === id),
    [collections],
  )

  const confirmDelete = (bookmark: Bookmark) => {
    if (confirm(`Delete "${bookmark.title || bookmark.url}"?`)) deleteBookmark(bookmark.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      {/* Header */}
      <div style={{ padding: `${spacing.lg}px ${spacing.lg}px ${spacing.sm}px`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: spacing.md }}>Search</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder='Search by title, URL, or tag...'
          colors={colors}
          autoFocus
        />
        {allTags.length > 0 && (
          <div style={{ marginTop: spacing.sm }}>
            <FilterRow>
              {allTags.map((tag) => (
                <FilterChip
                  key={tag}
                  label={`#${tag}`}
                  active={activeTag === tag}
                  onPress={() => setActiveTag(activeTag === tag ? null : tag)}
                  colors={colors}
                />
              ))}
            </FilterRow>
          </div>
        )}
      </div>

      {/* Results */}
      {hasInput ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title='No results found'
            subtitle={`Nothing matches "${query || activeTag}"`}
            colors={colors}
          />
        ) : (
          <div className='page-scroll' style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'flex-start' }}>
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
        )
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xxxl,
            gap: spacing.md,
            textAlign: 'center',
          }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: colors.primaryContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <SearchIcon size={36} color={colors.primary} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>Search your bookmarks</p>
          <p style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 260 }}>
            Find links by title, URL, tags, or description.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {[
              { num: bookmarks.length, label: 'Links' },
              { num: allTags.length, label: 'Tags' },
              { num: collections.length, label: 'Collections' },
            ].map(({ num, label }) => (
              <div
                key={label}
                style={{
                  background: colors.primaryContainer,
                  borderRadius: 12,
                  padding: '8px 16px',
                  textAlign: 'center',
                }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>{num}</p>
                <p style={{ fontSize: 11, color: colors.onPrimaryContainer }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
