import { api } from './api'
import type { AppSettings, Bookmark, Collection } from './types'

export interface SyncData {
  bookmarks: Bookmark[]
  collections: Collection[]
  settings: AppSettings
}

interface RemoteData {
  id: number
  data: Record<string, unknown>
  size: number
  created_at: string
}

const LAST_SYNCED_BACKUP_ID_KEY = 'stash_last_synced_backup_id'

// ── Merge ────────────────────────────────────────────────────────────────────

/**
 * Merges two data snapshots into one:
 * - Bookmarks: union by ID, keep the entry with the higher `updatedAt`
 * - Collections: union by ID, local takes precedence on conflict (no `updatedAt`)
 * - Settings: always kept from `local` (theme etc. stay per-device)
 */
export function mergeData(local: SyncData, remote: SyncData): SyncData {
  const bookmarkMap = new Map<string, Bookmark>()
  for (const b of [...remote.bookmarks, ...local.bookmarks]) {
    const cur = bookmarkMap.get(b.id)
    if (!cur || b.updatedAt > cur.updatedAt) bookmarkMap.set(b.id, b)
  }

  const collectionMap = new Map<string, Collection>()
  // Remote first so local overwrites on ID conflict
  for (const c of [...remote.collections, ...local.collections]) {
    if (!collectionMap.has(c.id)) collectionMap.set(c.id, c)
  }

  return {
    bookmarks: Array.from(bookmarkMap.values()).sort((a, b) => b.createdAt - a.createdAt),
    collections: Array.from(collectionMap.values()).sort((a, b) => a.createdAt - b.createdAt),
    settings: local.settings,
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getLastSyncedBackupId(): number | null {
  const raw = localStorage.getItem(LAST_SYNCED_BACKUP_ID_KEY)
  return raw ? parseInt(raw, 10) : null
}

function setLastSyncedBackupId(id: number): void {
  localStorage.setItem(LAST_SYNCED_BACKUP_ID_KEY, id.toString())
}

async function fetchLatestBackup(): Promise<RemoteData | null> {
  try {
    return (await api.backup.latest()) as unknown as RemoteData
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'No backup found') return null
    throw e
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Uploads a data snapshot to the server. */
export async function uploadData(data: SyncData): Promise<void> {
  await api.backup.upload({ ...data, exportedAt: Date.now(), version: 1 })
}

/**
 * Checks the server for a backup we haven't seen yet, merges it with `local`,
 * and returns the merged result. Returns `null` when already up to date.
 */
export async function fetchAndMerge(local: SyncData): Promise<{ merged: SyncData; backupId: number } | null> {
  const remote = await fetchLatestBackup()
  if (!remote) return null

  const lastSyncedId = getLastSyncedBackupId()
  if (remote.id === lastSyncedId) return null // already up to date

  const remoteData: SyncData = {
    bookmarks: Array.isArray(remote.data.bookmarks) ? (remote.data.bookmarks as Bookmark[]) : [],
    collections: Array.isArray(remote.data.collections) ? (remote.data.collections as Collection[]) : [],
    settings: (remote.data.settings as AppSettings | undefined) ?? local.settings,
  }

  setLastSyncedBackupId(remote.id)
  return { merged: mergeData(local, remoteData), backupId: remote.id }
}
