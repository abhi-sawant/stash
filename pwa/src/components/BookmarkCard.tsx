import { Link2, Pencil, Trash2 } from 'lucide-react'
import type { AppColors } from '../lib/theme'
import { getTagColor } from '../lib/theme'
import type { Bookmark, Collection } from '../lib/types'
import { extractDomain, formatDate } from '../lib/utils'
import ContextMenu from './ContextMenu'

interface Props {
  bookmark: Bookmark
  collection?: Collection
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  onCopyUrl: () => void
  colors: AppColors
}

export default function BookmarkCard({ bookmark, collection, onPress, onEdit, onDelete, onCopyUrl, colors }: Props) {
  return (
    <div
      onClick={onPress}
      style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${colors.shadow}`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}>
      {/* Cover image */}
      {bookmark.imageUri && (
        <img
          src={bookmark.imageUri}
          alt=''
          style={{ width: '100%', height: 140, objectFit: 'cover' }}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}

      <div style={{ padding: 12 }}>
        {/* Domain row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          {bookmark.faviconUri ? (
            <img
              src={bookmark.faviconUri}
              alt=''
              style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'contain' }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: colors.surfaceVariant,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Link2 size={9} color={colors.primary} />
            </div>
          )}
          <span
            style={{
              fontSize: 11,
              color: colors.textTertiary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
            {extractDomain(bookmark.url)}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.text,
            lineHeight: '18px',
            marginBottom: 4,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
          {bookmark.title || extractDomain(bookmark.url)}
        </p>

        {/* Subtitle */}
        {bookmark.subtitle && (
          <p
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: '16px',
              marginBottom: 6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
            {bookmark.subtitle}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {bookmark.tags.slice(0, 2).map((tag) => {
              const tc = getTagColor(tag)
              return (
                <span
                  key={tag}
                  style={{
                    background: tc.bg,
                    color: tc.text,
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '2px 7px',
                    borderRadius: 9999,
                  }}>
                  {tag}
                </span>
              )
            })}
            {bookmark.tags.length > 2 && (
              <span
                style={{
                  background: colors.surfaceVariant,
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '2px 7px',
                  borderRadius: 9999,
                }}>
                +{bookmark.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {collection ? (
            <span
              style={{
                background: `${collection.color}22`,
                color: collection.color,
                fontSize: 10,
                fontWeight: 500,
                padding: '2px 7px',
                borderRadius: 9999,
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
              {collection.name}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: colors.textTertiary }}>{formatDate(bookmark.createdAt)}</span>
          )}

          <ContextMenu
            colors={colors}
            actions={[
              { label: 'Edit', icon: <Pencil size={14} />, onPress: onEdit },
              { label: 'Copy URL', icon: <Link2 size={14} />, onPress: onCopyUrl },
              { label: 'Delete', icon: <Trash2 size={14} />, onPress: onDelete, destructive: true },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
