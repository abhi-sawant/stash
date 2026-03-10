import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import BookmarkMasonryCard from '../../components/BookmarkMasonryCard'
import EmptyState from '../../components/EmptyState'
import FAB from '../../components/FAB'
import { SearchBar } from '../../components/SearchBar'
import { useBookmarks } from '../../lib/context'
import { getColors, radius, spacing, typography } from '../../lib/theme'
import { Bookmark, Collection } from '../../lib/types'
import { searchFilter } from '../../lib/utils'

function getColumnCount(width: number): number {
  if (width >= 900) return 4
  if (width >= 600) return 3
  return 2
}

function buildColumns<T>(items: T[], numCols: number): T[][] {
  const cols: T[][] = Array.from({ length: numCols }, () => [])
  items.forEach((item, i) => cols[i % numCols].push(item))
  return cols
}

export default function CollectionDetailScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { id } = useLocalSearchParams<{ id: string }>()
  const { bookmarks, collections, deleteBookmark } = useBookmarks()

  const { width } = useWindowDimensions()
  const [query, setQuery] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const numColumns = getColumnCount(width)

  const collection = collections.find((c) => c.id === id)
  // Also include child collections
  const childCollectionIds = collections.filter((c) => c.parentId === id).map((c) => c.id)

  const allIds = [id, ...childCollectionIds]
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Text style={{ color: colors.text }}>Collection not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, marginTop: spacing.md }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const openBookmark = (bookmark: Bookmark) => {
    WebBrowser.openBrowserAsync(bookmark.url)
  }

  const confirmDelete = (bookmark: Bookmark) => {
    Alert.alert('Delete Bookmark', `Delete "${bookmark.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBookmark(bookmark.id) },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.iconBox, { backgroundColor: `${collection.color}20` }]}>
          <Ionicons name={collection.icon as any} size={20} color={collection.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {filtered.length} {filtered.length === 1 ? 'bookmark' : 'bookmarks'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/collection/add?edit=${collection.id}`)} style={styles.editBtn}>
          <Ionicons name='pencil-outline' size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search inside collection */}
      <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
        <SearchBar value={query} onChangeText={setQuery} placeholder='Search in collection...' />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon='bookmark-outline'
          title={query ? 'No matches' : 'Empty collection'}
          subtitle={query ? 'Try a different search' : 'Add bookmarks to this collection when saving a link'}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={(e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 200)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.masonryContent, { gap: spacing.sm, padding: spacing.sm }]}>
          {columns.map((col, ci) => (
            <View key={ci} style={[styles.column, { gap: spacing.sm }]}>
              {col.map((bookmark) => (
                <BookmarkMasonryCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  collection={getCollection(bookmark.collectionId)}
                  onPress={() => openBookmark(bookmark)}
                  onEdit={() => router.push(`/bookmark/${bookmark.id}`)}
                  onCopyUrl={() => Clipboard.setStringAsync(bookmark.url)}
                  onDelete={() => confirmDelete(bookmark)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {showScrollTop && <FAB onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} icon='chevron-up' />}
      {!showScrollTop && <FAB onPress={() => router.push(`/bookmark/add`)} icon='add' />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionName: { ...typography.headlineSmall },
  countText: { ...typography.bodySmall, marginTop: 2 },
  editBtn: {
    padding: spacing.sm,
    borderRadius: radius.full,
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyContent: { flexGrow: 1 },
  masonryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
})
