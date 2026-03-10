import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, getTagColor, radius, spacing, typography } from '../lib/theme'
import { Bookmark, Collection } from '../lib/types'
import { extractDomain, formatDate } from '../lib/utils'
import ContextMenu from './ContextMenu'

interface Props {
  bookmark: Bookmark
  collection?: Collection
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  onCopyUrl: () => void
}

export default function BookmarkCard({ bookmark, collection, onPress, onEdit, onDelete, onCopyUrl }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}>
      {/* Left: favicon/image */}
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
        {bookmark.faviconUri ? (
          <Image source={{ uri: bookmark.faviconUri }} style={styles.favicon} resizeMode='contain' />
        ) : (
          <Ionicons name='link' size={20} color={colors.primary} />
        )}
      </View>

      {/* Middle: text content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {bookmark.title || extractDomain(bookmark.url)}
        </Text>
        {bookmark.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {bookmark.subtitle}
          </Text>
        ) : (
          <Text style={[styles.domain, { color: colors.textTertiary }]} numberOfLines={1}>
            {extractDomain(bookmark.url)}
          </Text>
        )}
        <View style={styles.metaRow}>
          {bookmark.tags.slice(0, 2).map((tag) => {
            const tc = getTagColor(tag)
            return (
              <View key={tag} style={[styles.tag, { backgroundColor: tc.bg }]}>
                <Text style={[styles.tagText, { color: tc.text }]}>{tag}</Text>
              </View>
            )
          })}
          {bookmark.tags.length > 2 && (
            <View style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>+{bookmark.tags.length - 2}</Text>
            </View>
          )}
          {collection && (
            <View style={[styles.collectionBadge, { backgroundColor: `${collection.color}22` }]}>
              <Ionicons name='folder' size={10} color={collection.color} />
              <Text style={[styles.collectionText, { color: collection.color }]} numberOfLines={1}>
                {collection.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: date + menu */}
      <View style={styles.right}>
        <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(bookmark.createdAt)}</Text>
        <ContextMenu
          iconSize={18}
          actions={[
            { label: 'Edit', icon: 'pencil-outline', onPress: onEdit },
            { label: 'Copy URL', icon: 'link-outline', onPress: onCopyUrl },
            { label: 'Delete', icon: 'trash-outline', onPress: onDelete, destructive: true },
          ]}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  favicon: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.titleMedium,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  domain: {
    ...typography.bodySmall,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    ...typography.labelSmall,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  collectionText: {
    ...typography.labelSmall,
    maxWidth: 80,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
  },
  date: {
    ...typography.labelSmall,
  },
  moreIcon: {
    marginTop: 4,
  },
})
