import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppSettings, Bookmark, Collection } from './types'

const KEYS = {
  BOOKMARKS: 'pb_bookmarks',
  COLLECTIONS: 'pb_collections',
  SETTINGS: 'pb_settings',
}

export const defaultSettings: AppSettings = {
  themePreference: 'system',
}

// ── Bookmarks ──────────────────────────────────────────────────────────────
export async function loadBookmarks(): Promise<Bookmark[]> {
  const raw = await AsyncStorage.getItem(KEYS.BOOKMARKS)
  return raw ? JSON.parse(raw) : []
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks))
}

// ── Collections ────────────────────────────────────────────────────────────
export async function loadCollections(): Promise<Collection[]> {
  const raw = await AsyncStorage.getItem(KEYS.COLLECTIONS)
  return raw ? JSON.parse(raw) : []
}

export async function saveCollections(collections: Collection[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections))
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS)
  return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ── Export all data ────────────────────────────────────────────────────────
export async function exportAllData() {
  const bookmarks = await loadBookmarks()
  const collections = await loadCollections()
  const settings = await loadSettings()
  return { bookmarks, collections, settings, exportedAt: Date.now(), version: 1 }
}

// ── Import all data ────────────────────────────────────────────────────────
export async function importAllData(data: ReturnType<typeof exportAllData> extends Promise<infer T> ? T : never) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup data')
  if (data.version !== 1) throw new Error('Unsupported backup version')
  await saveBookmarks(data.bookmarks ?? [])
  await saveCollections(data.collections ?? [])
  await saveSettings({ ...defaultSettings, ...(data.settings ?? {}) })
}

// ── Clear all ──────────────────────────────────────────────────────────────
export async function clearAllData() {
  await AsyncStorage.multiRemove([KEYS.BOOKMARKS, KEYS.COLLECTIONS, KEYS.SETTINGS])
}
