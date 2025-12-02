import { useState, useEffect } from 'react';
import type { Collection } from '@/types';
import * as db from '@/lib/db';
import { generateId } from '@/lib/utils';
import { syncService } from '@/lib/sync';
import { useAuth } from '@/contexts/AuthContext';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await db.getAllCollections();
      setCollections(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  // Fix collections without icons (migration)
  const fixMissingIcons = async () => {
    try {
      const data = await db.getAllCollections();
      let updated = false;

      for (const collection of data) {
        if (!collection.icon) {
          await db.updateCollection({
            ...collection,
            icon: collection.name === 'Miscellaneous' ? 'folder' : 'folder',
            lastModifiedAt: Date.now(),
          });
          updated = true;
        }
      }

      if (updated && user) {
        // Sync the icon updates to cloud
        await syncService.syncCollectionsToCloud(user.id);
      }
    } catch (err) {
      console.error('Failed to fix missing icons:', err);
    }
  };

  useEffect(() => {
    loadCollections().then(() => {
      // Fix any collections without icons after loading
      fixMissingIcons();
    });
  }, []);

  // Reload collections when user changes (sign in/out)
  useEffect(() => {
    if (user) {
      // User signed in - data will be synced by AuthContext, just reload from local
      loadCollections();
    } else {
      // User signed out - clear collections from state
      setCollections([]);
    }
  }, [user?.id]); // Only re-run when user ID changes, not on every user object update

  // Subscribe to sync completion events to reload data
  useEffect(() => {
    const unsubscribe = syncService.onSyncComplete(() => {
      loadCollections();
    });

    return unsubscribe;
  }, []);

  const addCollection = async (
    collection: Omit<Collection, 'id' | 'createdAt' | 'lastModifiedAt'>
  ) => {
    // Check if collection with same name already exists
    const existingCollection = collections.find(
      c => c.name.toLowerCase() === collection.name.toLowerCase()
    );

    if (existingCollection) {
      throw new Error(`Collection "${collection.name}" already exists`);
    }

    const newCollection: Collection = {
      ...collection,
      id: generateId(),
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
    };

    // Optimistic update - update UI immediately
    setCollections(prev => [...prev, newCollection]);

    // Then persist to IndexedDB in the background
    db.addCollection(newCollection).catch(error => {
      console.error('Failed to save collection to IndexedDB:', error);
      // Rollback on error
      setCollections(prev => prev.filter(c => c.id !== newCollection.id));
    });

    // Sync to cloud in the background if user is logged in
    if (user) {
      syncService.syncCollectionsToCloud(user.id).catch(console.error);
    }

    return newCollection;
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    const existing = collections.find(c => c.id === id);
    if (!existing) throw new Error('Collection not found');

    const updated: Collection = {
      ...existing,
      ...updates,
      lastModifiedAt: Date.now(),
    };

    // Optimistic update - update UI immediately
    setCollections(prev => prev.map(c => (c.id === id ? updated : c)));

    // Then persist to IndexedDB in the background
    db.updateCollection(updated).catch(error => {
      console.error('Failed to update collection in IndexedDB:', error);
      // Rollback on error
      setCollections(prev => prev.map(c => (c.id === id ? existing : c)));
    });

    // Sync to cloud in the background if user is logged in
    if (user) {
      syncService.syncCollectionsToCloud(user.id).catch(console.error);
    }

    return updated;
  };

  const deleteCollection = async (id: string) => {
    const existing = collections.find(c => c.id === id);

    // Soft delete the collection locally (this also soft deletes bookmarks)
    await db.deleteCollection(id);

    // Optimistically mark as deleted in UI
    setCollections(prev => prev.filter(c => c.id !== id));

    // Sync the soft delete to cloud
    if (user) {
      // Use deleteCollectionFromCloud which now does soft delete
      syncService.deleteCollectionFromCloud(user.id, id).catch(error => {
        console.error('Failed to sync collection deletion to cloud:', error);
        // Note: Local soft delete already happened, so we don't rollback
      });

      // Also sync any soft-deleted bookmarks
      const bookmarksInCollection = await db.getBookmarksByCollection(id);
      for (const bookmark of bookmarksInCollection) {
        syncService.deleteBookmarkFromCloud(user.id, bookmark.id).catch(console.error);
      }
    }
  };

  const getCollectionTree = (): Collection[] => {
    const rootCollections = collections.filter(c => !c.parentId);
    return rootCollections.sort((a, b) => a.order - b.order);
  };

  const getChildCollections = (parentId: string): Collection[] => {
    return collections.filter(c => c.parentId === parentId).sort((a, b) => a.order - b.order);
  };

  const cleanupDuplicates = async () => {
    // Find duplicate "All" or "Miscellaneous" collections
    const allCollections = collections.filter(c => c.name === 'All');
    const miscCollections = collections.filter(c => c.name === 'Miscellaneous');

    // Clean up "All" duplicates
    if (allCollections.length > 1) {
      // Keep the first one, delete the rest
      const toDelete = allCollections.slice(1);
      for (const collection of toDelete) {
        await db.deleteCollection(collection.id);
      }
    }

    // Clean up "Miscellaneous" duplicates
    if (miscCollections.length > 1) {
      // Keep the first one, delete the rest
      const toDelete = miscCollections.slice(1);
      for (const collection of toDelete) {
        await db.deleteCollection(collection.id);
      }
    }

    // Rename "All" to "Miscellaneous" if it exists
    if (allCollections.length > 0 && miscCollections.length === 0) {
      const allCollection = allCollections[0];
      await db.updateCollection({
        ...allCollection,
        name: 'Miscellaneous',
        icon: 'folder', // Set default folder icon for Miscellaneous
        lastModifiedAt: Date.now(),
      });
    }

    await loadCollections();
  };

  return {
    collections,
    loading,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    getCollectionTree,
    getChildCollections,
    refresh: loadCollections,
    cleanupDuplicates,
  };
}
