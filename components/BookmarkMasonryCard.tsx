import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, radius, spacing, typography } from '../lib/theme'
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

export default function BookmarkMasonryCard({ bookmark, collection, onPress, onEdit, onDelete, onCopyUrl }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}>
      {/* Cover image */}
      {bookmark.imageUri ? (
        <Image source={{ uri: bookmark.imageUri }} style={styles.coverImage} resizeMode='cover' />
      ) : null}

      <View style={styles.body}>
        {/* Domain row */}
        <View style={styles.domainRow}>
          {bookmark.faviconUri ? (
            <Image source={{ uri: bookmark.faviconUri }} style={styles.favicon} resizeMode='contain' />
          ) : (
            <View style={[styles.faviconBox, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name='link' size={10} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.domain, { color: colors.textTertiary }]} numberOfLines={1}>
            {extractDomain(bookmark.url)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
          {bookmark.title || extractDomain(bookmark.url)}
        </Text>

        {/* Description */}
        {!!bookmark.subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {bookmark.subtitle}
          </Text>
        )}

        {/* Footer: collection badge + menu */}
        <View style={styles.footer}>
          {collection ? (
            <View style={[styles.collectionBadge, { backgroundColor: `${collection.color}22` }]}>
              <Ionicons name='folder' size={10} color={collection.color} />
              <Text style={[styles.collectionText, { color: collection.color }]} numberOfLines={1}>
                {collection.name}
              </Text>
            </View>
          ) : (
            <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(bookmark.createdAt)}</Text>
          )}
          <ContextMenu
            iconSize={16}
            actions={[
              { label: 'Edit', icon: 'pencil-outline', onPress: onEdit },
              { label: 'Copy URL', icon: 'link-outline', onPress: onCopyUrl },
              { label: 'Delete', icon: 'trash-outline', onPress: onDelete, destructive: true },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  body: {
    padding: spacing.md,
    gap: 5,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  faviconBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domain: {
    ...typography.labelSmall,
    flex: 1,
  },
  title: {
    ...typography.titleSmall,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
    maxWidth: 70,
  },
  date: {
    ...typography.labelSmall,
  },
})
