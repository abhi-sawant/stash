import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import CollectionCard from '../../components/CollectionCard'
import EmptyState from '../../components/EmptyState'
import FAB from '../../components/FAB'
import { useBookmarks } from '../../lib/context'
import { getColors, spacing, typography } from '../../lib/theme'
import { Collection } from '../../lib/types'

export default function CollectionsScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { collections, bookmarks, deleteCollection } = useBookmarks()

  const getBookmarkCount = (collectionId: string) => bookmarks.filter((b) => b.collectionId === collectionId).length

  const confirmDelete = (collection: Collection) => {
    const count = getBookmarkCount(collection.id)
    Alert.alert(
      'Delete Collection',
      `Delete "${collection.name}"?${count > 0 ? ` ${count} bookmark${count > 1 ? 's' : ''} will be unassigned.` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCollection(collection.id) },
      ],
    )
  }

  // Render data: root collections with their children expanded below
  const rootCollections = collections.filter((c) => !c.parentId)

  const renderItem = ({ item, index }: { item: Collection; index: number }) => {
    const children = collections.filter((c) => c.parentId === item.id)

    return (
      <View style={styles.groupContainer}>
        <CollectionCard
          collection={item}
          bookmarkCount={getBookmarkCount(item.id)}
          onPress={() => router.push(`/collection/${item.id}`)}
          onEdit={() => router.push(`/collection/add?edit=${item.id}`)}
          onDelete={() => confirmDelete(item)}
        />
        {children.length > 0 && (
          <View style={styles.childrenContainer}>
            {children.map((child) => (
              <View key={child.id} style={styles.childRow}>
                <View style={[styles.childConnector, { borderColor: colors.border }]} />
                <View style={styles.childCardWrapper}>
                  <CollectionCard
                    collection={child}
                    bookmarkCount={getBookmarkCount(child.id)}
                    onPress={() => router.push(`/collection/${child.id}`)}
                    onEdit={() => router.push(`/collection/add?edit=${child.id}`)}
                    onDelete={() => confirmDelete(child)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  // Pair root collections for 2-column layout
  const pairs: Collection[][] = []
  for (let i = 0; i < rootCollections.length; i += 2) {
    pairs.push(rootCollections.slice(i, i + 2))
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.text }]}>Collections</Text>
        <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
          {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
        </Text>
      </View>

      <FlatList
        data={pairs}
        keyExtractor={(_, i) => `pair-${i}`}
        renderItem={({ item: pair }) => (
          <View style={styles.pairRow}>
            {pair.map((col) => {
              const children = collections.filter((c) => c.parentId === col.id)
              return (
                <View key={col.id} style={styles.pairItem}>
                  <CollectionCard
                    collection={col}
                    bookmarkCount={getBookmarkCount(col.id)}
                    onPress={() => router.push(`/collection/${col.id}`)}
                    onEdit={() => router.push(`/collection/add?edit=${col.id}`)}
                    onDelete={() => confirmDelete(col)}
                  />
                  {children.map((child) => (
                    <View key={child.id} style={[styles.childWrapper, { borderLeftColor: child.color }]}>
                      <Text style={[styles.childName, { color: colors.textSecondary }]} numberOfLines={1}>
                        <Ionicons name={child.icon as any} size={11} color={colors.textSecondary} /> {child.name}
                      </Text>
                      <Text style={[styles.childCount, { color: colors.textTertiary }]}>
                        {getBookmarkCount(child.id)} links
                      </Text>
                    </View>
                  ))}
                </View>
              )
            })}
            {pair.length === 1 && <View style={styles.pairItem} />}
          </View>
        )}
        contentContainerStyle={[styles.listContent, rootCollections.length === 0 && styles.emptyContent]}
        ListEmptyComponent={
          <EmptyState
            icon='folder-outline'
            title='No collections yet'
            subtitle='Tap + to create your first collection and organize your links'
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => router.push('/collection/add')} icon='add' />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...typography.headlineLarge },
  subTitle: { ...typography.bodySmall, marginTop: 2 },
  listContent: { padding: spacing.lg, gap: spacing.md },
  emptyContent: { flexGrow: 1 },
  pairRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pairItem: {
    flex: 1,
    gap: spacing.sm,
  },
  childWrapper: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  childName: { ...typography.labelSmall },
  childCount: { ...typography.labelSmall, marginTop: 2 },
  groupContainer: {},
  childrenContainer: { marginTop: spacing.sm },
  childRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  childConnector: {
    width: 16,
    height: 20,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 6,
    marginRight: spacing.sm,
    marginTop: 12,
  },
  childCardWrapper: { flex: 1 },
})
