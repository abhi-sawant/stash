import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import BookmarkMasonryCard from '../../components/BookmarkMasonryCard'
import EmptyState from '../../components/EmptyState'
import FAB from '../../components/FAB'
import { FilterChip, FilterRow, SearchBar } from '../../components/SearchBar'
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

export default function HomeScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, deleteBookmark } = useBookmarks()
  const { width } = useWindowDimensions()

  const [query, setQuery] = useState('')
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollRef = useRef<ScrollView>(null)
  const numColumns = getColumnCount(width)

  const filtered = bookmarks.filter((b) => {
    if (activeCollectionId && b.collectionId !== activeCollectionId) return false
    if (query) {
      return searchFilter(query, b.title, b.subtitle, b.url)
    }
    return true
  })

  const columns = buildColumns(filtered, numColumns)

  const getCollection = useCallback(
    (id?: string): Collection | undefined => collections.find((c) => c.id === id),
    [collections],
  )

  const openBookmark = (bookmark: Bookmark) => {
    WebBrowser.openBrowserAsync(bookmark.url)
  }

  const confirmDelete = (bookmark: Bookmark) => {
    Alert.alert('Delete Bookmark', `Delete "${bookmark.title || bookmark.url}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBookmark(bookmark.id) },
    ])
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true })

  const onScroll = (event: any) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 200)
  }

  const GAP = spacing.sm

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Persistent header — always visible above the scroll */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.appName, { color: colors.primary }]}>Stash</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'link' : 'links'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={() => router.push('/bookmark/add')}>
            <Ionicons name='add' size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {collections.length > 0 && (
          <FilterRow>
            <FilterChip
              label='All'
              active={!activeCollectionId}
              onPress={() => {
                setActiveCollectionId(null)
              }}
              icon='apps'
            />
            {collections.map((col) => (
              <FilterChip
                key={col.id}
                label={col.name}
                active={activeCollectionId === col.id}
                onPress={() => {
                  setActiveCollectionId(activeCollectionId === col.id ? null : col.id)
                }}
                icon='folder'
              />
            ))}
          </FilterRow>
        )}
      </View>

      {/* Masonry grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon='bookmark-outline'
          title={query || activeCollectionId ? 'No matches found' : 'No bookmarks yet'}
          subtitle={
            query || activeCollectionId
              ? 'Try a different search or filter'
              : 'Tap the + button to save your first link'
          }
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.masonryContent, { gap: GAP, padding: GAP }]}>
          {columns.map((col, ci) => (
            <View key={ci} style={[styles.column, { gap: GAP }]}>
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

      {showScrollTop && <FAB onPress={scrollToTop} icon='chevron-up' />}
      {!showScrollTop && <FAB onPress={() => router.push('/bookmark/add')} icon='add' />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  appName: { ...typography.headlineLarge },
  subtitleText: { ...typography.bodySmall, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masonryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
})
