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
        data={collections}
        keyExtractor={(col) => col.id}
        renderItem={({ item: col }) => (
          <CollectionCard
            collection={col}
            bookmarkCount={getBookmarkCount(col.id)}
            onPress={() => router.push(`/collection/${col.id}`)}
            onEdit={() => router.push(`/collection/add?edit=${col.id}`)}
            onDelete={() => confirmDelete(col)}
          />
        )}
        contentContainerStyle={[styles.listContent, collections.length === 0 && styles.emptyContent]}
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
  listContent: { padding: spacing.md, gap: spacing.sm },
  emptyContent: { flexGrow: 1 },
})
