import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import BookmarkMasonryCard from '../../components/BookmarkMasonryCard'
import EmptyState from '../../components/EmptyState'
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

export default function SearchScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { bookmarks, collections, settings, deleteBookmark, getAllTags } = useBookmarks()

  const { width } = useWindowDimensions()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = getAllTags()
  const numColumns = getColumnCount(width)

  const filtered = bookmarks.filter((b) => {
    if (activeTag && !b.tags.includes(activeTag)) return false
    if (query.trim()) {
      return searchFilter(query, b.title, b.subtitle, b.url, ...b.tags)
    }
    return activeTag ? true : false
  })

  const columns = buildColumns(filtered, numColumns)

  const getCollection = useCallback(
    (id?: string): Collection | undefined => collections.find((c) => c.id === id),
    [collections],
  )

  const openBookmark = (bookmark: Bookmark) => {
    const { browserPreference } = settings
    const url = bookmark.url
    const encodedUrl = encodeURIComponent(url)
    if (browserPreference === 'chrome') {
      Linking.openURL(`googlechromes://${url.replace(/^https?:\/\//, '')}`).catch(() =>
        WebBrowser.openBrowserAsync(url),
      )
    } else if (browserPreference === 'firefox') {
      Linking.openURL(`firefox://open-url?url=${encodedUrl}`).catch(() => WebBrowser.openBrowserAsync(url))
    } else if (browserPreference === 'brave') {
      Linking.openURL(`brave://open-url?url=${encodedUrl}`).catch(() => WebBrowser.openBrowserAsync(url))
    } else {
      WebBrowser.openBrowserAsync(url)
    }
  }

  const confirmDelete = (bookmark: Bookmark) => {
    Alert.alert('Delete Bookmark', `Delete "${bookmark.title || bookmark.url}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBookmark(bookmark.id) },
    ])
  }

  const hasResults = query.trim().length > 0 || activeTag !== null

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Search</Text>
        <View style={{ paddingBottom: spacing.sm }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            placeholder='Search by title, URL, or tag...'
          />
        </View>
        {allTags.length > 0 && (
          <FilterRow>
            {allTags.map((tag) => {
              return (
                <FilterChip
                  key={tag}
                  label={`#${tag}`}
                  active={activeTag === tag}
                  onPress={() => setActiveTag(activeTag === tag ? null : tag)}
                />
              )
            })}
          </FilterRow>
        )}
      </View>

      {/* Results */}
      {hasResults ? (
        filtered.length === 0 ? (
          <EmptyState
            icon='search-outline'
            title='No results found'
            subtitle={`Nothing matches "${query || activeTag}"`}
          />
        ) : (
          <ScrollView
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
        )
      ) : (
        <View style={styles.promptContainer}>
          <View style={[styles.promptIcon, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name='search' size={36} color={colors.primary} />
          </View>
          <Text style={[styles.promptTitle, { color: colors.text }]}>Search your bookmarks</Text>
          <Text style={[styles.promptText, { color: colors.textSecondary }]}>
            Find links by title, URL, tags, or description. Browse by tag using the chips above.
          </Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{bookmarks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>Links</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{allTags.length}</Text>
              <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>Tags</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{collections.length}</Text>
              <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>Collections</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  title: {
    ...typography.headlineLarge,
    marginBottom: spacing.sm,
  },
  emptyContent: { flexGrow: 1 },
  masonryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  promptIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  promptTitle: {
    ...typography.headlineSmall,
    textAlign: 'center',
  },
  promptText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: 2,
  },
  statNum: {
    ...typography.headlineMedium,
  },
  statLabel: {
    ...typography.labelSmall,
  },
})
