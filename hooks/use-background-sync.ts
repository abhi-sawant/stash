import { useCallback, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useAuth } from '../lib/auth-context'
import { useBookmarks } from '../lib/context'
import { fetchAndMerge, uploadData } from '../lib/sync'

/**
 * Keeps the local store in sync with the server.
 *
 * Sync happens on app launch and every time the app comes back to the foreground.
 * The hook fetches the latest server backup, merges it with local data (union
 * of bookmarks by updatedAt, union of collections), then uploads the reconciled
 * result so all other devices see the combined state.
 *
 * Mutations are uploaded separately via the debounced upload inside
 * BookmarksProvider (see lib/context.tsx).
 */
export function useBackgroundSync() {
  const { user } = useAuth()
  const { bookmarks, collections, settings, restore } = useBookmarks()
  const isSyncing = useRef(false)

  // Keep a ref so the async callback always reads the latest state without
  // needing to re-register the AppState listener on every state change.
  const stateRef = useRef({ bookmarks, collections, settings })
  useEffect(() => {
    stateRef.current = { bookmarks, collections, settings }
  }, [bookmarks, collections, settings])

  const performSync = useCallback(async () => {
    if (!user || isSyncing.current) return
    isSyncing.current = true
    try {
      const result = await fetchAndMerge(stateRef.current)
      if (result) {
        // Apply merged state locally and push the reconciled snapshot so other
        // devices see both their changes and ours.
        restore(result.merged)
        await uploadData(result.merged)
      }
    } catch {
      // Ignore sync errors — will retry on next focus
    } finally {
      isSyncing.current = false
    }
  }, [user, restore])

  useEffect(() => {
    // Sync on mount (app launch / login)
    performSync()

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        performSync()
      }
    })

    return () => subscription.remove()
  }, [performSync])
}
