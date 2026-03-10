import { FolderOpen, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CollectionCard from '../components/CollectionCard'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { useBookmarks } from '../lib/context'
import { getColors, spacing } from '../lib/theme'
import type { Collection } from '../lib/types'

export default function CollectionsPage() {
  const navigate = useNavigate()
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { collections, bookmarks, deleteCollection } = useBookmarks()

  const getBookmarkCount = (id: string) => bookmarks.filter((b) => b.collectionId === id).length

  const confirmDelete = (collection: Collection) => {
    const count = getBookmarkCount(collection.id)
    const msg = `Delete "${collection.name}"?${count > 0 ? ` ${count} bookmark${count > 1 ? 's' : ''} will be unassigned.` : ''}`
    if (confirm(msg)) deleteCollection(collection.id)
  }

  const rootCollections = collections.filter((c) => !c.parentId)

  // Build pairs for 2-column layout
  const pairs: Collection[][] = []
  for (let i = 0; i < rootCollections.length; i += 2) {
    pairs.push(rootCollections.slice(i, i + 2))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      {/* Header */}
      <div
        style={{
          padding: `${spacing.lg}px ${spacing.lg}px ${spacing.md}px`,
          borderBottom: `1px solid ${colors.divider}`,
          flexShrink: 0,
        }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Collections</h1>
        <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
        </p>
      </div>

      {rootCollections.length === 0 ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <EmptyState
            icon={FolderOpen}
            title='No collections yet'
            subtitle='Tap + to create your first collection and organize your links'
            colors={colors}
          />
        </div>
      ) : (
        <div className='page-scroll' style={{ padding: spacing.lg }}>
          {pairs.map((pair, pi) => (
            <div key={pi} style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
              {pair.map((col) => {
                const children = collections.filter((c) => c.parentId === col.id)
                return (
                  <div key={col.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    <CollectionCard
                      collection={col}
                      bookmarkCount={getBookmarkCount(col.id)}
                      onPress={() => navigate(`/collection/${col.id}`)}
                      onEdit={() => navigate(`/collection/add?edit=${col.id}`)}
                      onDelete={() => confirmDelete(col)}
                      colors={colors}
                    />
                    {children.map((child) => (
                      <div
                        key={child.id}
                        style={{
                          borderLeft: `3px solid ${child.color}`,
                          paddingLeft: spacing.sm,
                          paddingTop: spacing.xs,
                          paddingBottom: spacing.xs,
                          marginLeft: 4,
                        }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: colors.textSecondary }}>{child.name}</p>
                        <p style={{ fontSize: 11, color: colors.textTertiary }}>{getBookmarkCount(child.id)} links</p>
                      </div>
                    ))}
                  </div>
                )
              })}
              {pair.length === 1 && <div style={{ flex: 1 }} />}
            </div>
          ))}
          {/* Bottom FAB padding */}
          <div style={{ height: 80 }} />
        </div>
      )}

      <FAB icon={Plus} onPress={() => navigate('/collection/add')} colors={colors} />
    </div>
  )
}
