import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Bookmark, SearchFilters, SortBy, SortOrder } from '@/types';
import * as db from '@/lib/db';
import { generateId } from '@/lib/utils';
import { syncService } from '@/lib/sync';
import { thumbnailService } from '@/lib/thumbnailService';
import { useAuth } from './AuthContext';

interface BookmarksContextType {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  addBookmark: (
    bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'lastModifiedAt'>
  ) => Promise<Bookmark>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<Bookmark>;
  deleteBookmark: (id: string) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  filterBookmarks: (filters: SearchFilters) => Bookmark[];
  sortBookmarks: (sortBy: SortBy, order: SortOrder) => Bookmark[];
  refresh: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await db.getAllBookmarks();
      // Sort by creation date, newest first
      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      setBookmarks(sorted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  // Reload bookmarks when user changes (sign in/out)
  useEffect(() => {
    if (user) {
      // User signed in - data will be synced by AuthContext, just reload from local
      loadBookmarks();
    } else {
      // User signed out - clear bookmarks from state
      setBookmarks([]);
    }
  }, [user?.id]); // Only re-run when user ID changes, not on every user object update

  // Subscribe to sync completion events to reload data
  useEffect(() => {
    const unsubscribe = syncService.onSyncComplete(() => {
      loadBookmarks();
    });

    return unsubscribe;
  }, []);

  // Subscribe to thumbnail updates to update UI in real-time
  useEffect(() => {
    const unsubscribe = thumbnailService.onThumbnailUpdate(updatedBookmark => {
      setBookmarks(prev => prev.map(b => (b.id === updatedBookmark.id ? updatedBookmark : b)));
    });

    return unsubscribe;
  }, []);

  const addBookmark = async (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'lastModifiedAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: generateId(),
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
    };

    // Optimistic update - update UI immediately
    setBookmarks(prev => [newBookmark, ...prev]);

    // Then persist to IndexedDB in the background
    db.addBookmark(newBookmark).catch(error => {
      console.error('Failed to save bookmark to IndexedDB:', error);
      // Rollback on error
      setBookmarks(prev => prev.filter(b => b.id !== newBookmark.id));
    });

    // Sync to cloud in the background if user is logged in
    if (user) {
      syncService.syncBookmarksToCloud(user.id).catch(console.error);
    }

    // If thumbnail or favicon is missing, try to fetch it in background
    if (!newBookmark.thumbnail || !newBookmark.favicon) {
      thumbnailService
        .fetchThumbnailForUrl(newBookmark.url)
        .then(async ({ thumbnail, favicon }) => {
          if (thumbnail || favicon) {
            const updated: Bookmark = {
              ...newBookmark,
              thumbnail: thumbnail || newBookmark.thumbnail,
              favicon: favicon || newBookmark.favicon,
              lastModifiedAt: Date.now(),
            };

            // Update in database and state
            await db.updateBookmark(updated);
            setBookmarks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
          }
        })
        .catch(error => {
          console.error('Failed to fetch thumbnail in background:', error);
        });
    }

    return newBookmark;
  };

  const updateBookmark = async (id: string, updates: Partial<Bookmark>) => {
    const existing = bookmarks.find(b => b.id === id);
    if (!existing) throw new Error('Bookmark not found');

    const updated: Bookmark = {
      ...existing,
      ...updates,
      lastModifiedAt: Date.now(),
    };

    // Optimistic update - update UI immediately
    setBookmarks(prev => prev.map(b => (b.id === id ? updated : b)));

    // Then persist to IndexedDB in the background
    db.updateBookmark(updated).catch(error => {
      console.error('Failed to update bookmark in IndexedDB:', error);
      // Rollback on error
      setBookmarks(prev => prev.map(b => (b.id === id ? existing : b)));
    });

    // Sync to cloud in the background if user is logged in
    if (user) {
      syncService.syncBookmarksToCloud(user.id).catch(console.error);
    }

    return updated;
  };

  const deleteBookmark = async (id: string) => {
    const existing = bookmarks.find(b => b.id === id);

    // Optimistic update - update UI immediately
    setBookmarks(prev => prev.filter(b => b.id !== id));

    // Then delete from IndexedDB in the background
    db.deleteBookmark(id).catch(error => {
      console.error('Failed to delete bookmark from IndexedDB:', error);
      // Rollback on error - restore the bookmark
      if (existing) {
        setBookmarks(prev => [...prev, existing]);
      }
    });

    // Delete from cloud in the background if user is logged in
    if (user) {
      syncService.deleteBookmarkFromCloud(user.id, id).catch(console.error);
    }
  };

  const batchDelete = async (ids: string[]) => {
    await db.batchDeleteBookmarks(ids);
    setBookmarks(prev => prev.filter(b => !ids.includes(b.id)));
  };

  const filterBookmarks = (filters: SearchFilters): Bookmark[] => {
    return bookmarks.filter(bookmark => {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (filters.collectionId && bookmark.collectionId !== filters.collectionId) {
        return false;
      }

      return true;
    });
  };

  const sortBookmarks = (sortBy: SortBy = 'createdAt', order: SortOrder = 'desc'): Bookmark[] => {
    const sorted = [...bookmarks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'url':
          comparison = a.url.localeCompare(b.url);
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'lastModifiedAt':
          comparison = a.lastModifiedAt - b.lastModifiedAt;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const refresh = async () => {
    await loadBookmarks();
  };

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        loading,
        error,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        batchDelete,
        filterBookmarks,
        sortBookmarks,
        refresh,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
