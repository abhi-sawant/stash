// Web localStorage-based storage (mirrors the RN AsyncStorage layer)

import type { AppSettings, Bookmark, Collection } from './types'

const KEYS = {
  BOOKMARKS: 'pb_bookmarks',
  COLLECTIONS: 'pb_collections',
  SETTINGS: 'pb_settings',
}

export const defaultSettings: AppSettings = {
  themePreference: 'system',
}

// ── Bookmarks ────────────────────────────────────────────────────────────────
export function loadBookmarks(): Bookmark[] {
  const raw = localStorage.getItem(KEYS.BOOKMARKS)
  return raw ? JSON.parse(raw) : []
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks))
}

// ── Collections ──────────────────────────────────────────────────────────────
export function loadCollections(): Collection[] {
  const raw = localStorage.getItem(KEYS.COLLECTIONS)
  return raw ? JSON.parse(raw) : []
}

export function saveCollections(collections: Collection[]): void {
  localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections))
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(KEYS.SETTINGS)
  return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ── Export all data ──────────────────────────────────────────────────────────
export function exportAllData() {
  const bookmarks = loadBookmarks()
  const collections = loadCollections()
  const settings = loadSettings()
  return { bookmarks, collections, settings, exportedAt: Date.now(), version: 1 }
}

// ── Import all data ──────────────────────────────────────────────────────────
export function importAllData(data: ReturnType<typeof exportAllData>) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup data')
  if (data.version !== 1) throw new Error('Unsupported backup version')
  saveBookmarks(data.bookmarks ?? [])
  saveCollections(data.collections ?? [])
  saveSettings({ ...defaultSettings, ...(data.settings ?? {}) })
}

// ── Clear all ────────────────────────────────────────────────────────────────
export function clearAllData() {
  localStorage.removeItem(KEYS.BOOKMARKS)
  localStorage.removeItem(KEYS.COLLECTIONS)
  localStorage.removeItem(KEYS.SETTINGS)
}
