import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, radius, spacing, typography } from '../lib/theme'
import { Collection } from '../lib/types'
import ContextMenu from './ContextMenu'

interface Props {
  collection: Collection
  bookmarkCount: number
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CollectionCard({ collection, bookmarkCount, onPress, onEdit, onDelete }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={[styles.iconContainer, { backgroundColor: `${collection.color}20` }]}>
        <Ionicons name={collection.icon as any} size={20} color={collection.color} />
      </View>
      <View style={styles.textGroup}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {collection.name}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {bookmarkCount} {bookmarkCount === 1 ? 'link' : 'links'}
        </Text>
      </View>
      <ContextMenu
        iconSize={16}
        actions={[
          { label: 'Edit', icon: 'pencil-outline', onPress: onEdit },
          { label: 'Delete', icon: 'trash-outline', onPress: onDelete, destructive: true },
        ]}
      />
      <View style={[styles.colorBar, { backgroundColor: collection.color }]} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.titleSmall,
  },
  count: {
    ...typography.labelSmall,
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    bottom: 0,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  menuBtn: {},
})
