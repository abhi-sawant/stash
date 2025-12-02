import { supabase } from './supabase';
import * as db from './db';

interface SyncStatus {
  lastSync: number;
  isSyncing: boolean;
  error: string | null;
}

const SYNC_KEY = 'bookmark_last_sync';

export class SyncService {
  private static instance: SyncService;
  private syncStatus: SyncStatus = {
    lastSync: 0,
    isSyncing: false,
    error: null,
  };
  private syncCompleteCallbacks: (() => void)[] = [];

  private constructor() {
    // Load last sync time from localStorage
    const lastSync = localStorage.getItem(SYNC_KEY);
    if (lastSync) {
      this.syncStatus.lastSync = parseInt(lastSync, 10);
    }
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Subscribe to sync completion events
  onSyncComplete(callback: () => void): () => void {
    this.syncCompleteCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.syncCompleteCallbacks = this.syncCompleteCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers that sync completed
  private notifySyncComplete() {
    this.syncCompleteCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in sync complete callback:', error);
      }
    });
  }

  private updateLastSync() {
    const now = Date.now();
    this.syncStatus.lastSync = now;
    localStorage.setItem(SYNC_KEY, now.toString());
  }

  // Sync collections from local to Supabase
  async syncCollectionsToCloud(userId: string): Promise<void> {
    // Get all collections including deleted ones for sync
    const allCollections = await (await db.getDB()).getAll('collections');

    for (const collection of allCollections) {
      try {
        // Check if collection exists in Supabase
        const { data: existing } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collection.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          // Update if local version is newer
          if (collection.lastModifiedAt > existing.last_modified_at) {
            await supabase
              .from('collections')
              .update({
                name: collection.name,
                description: collection.description,
                color: collection.color,
                icon: collection.icon,
                order: collection.order,
                is_deleted: collection.isDeleted || false,
                deleted_at: collection.deletedAt
                  ? new Date(collection.deletedAt).toISOString()
                  : null,
                last_modified_at: new Date(collection.lastModifiedAt).toISOString(),
              })
              .eq('id', collection.id)
              .eq('user_id', userId);
          }
        } else {
          // Insert new collection
          const { error: insertError } = await supabase.from('collections').insert({
            id: collection.id,
            user_id: userId,
            name: collection.name,
            description: collection.description || '',
            color: collection.color || '#6366f1',
            icon: collection.icon || null,
            order: collection.order || 0,
            is_deleted: collection.isDeleted || false,
            deleted_at: collection.deletedAt ? new Date(collection.deletedAt).toISOString() : null,
            created_at: new Date(collection.createdAt).toISOString(),
            last_modified_at: new Date(collection.lastModifiedAt).toISOString(),
          });

          if (insertError) {
            console.error('Error inserting collection:', collection.id, insertError);
            throw insertError;
          }
        }
      } catch (error) {
        console.error('Error syncing collection:', collection.id, error);
        // Continue with next collection instead of failing completely
      }
    }
  }

  // Sync collections from Supabase to local
  async syncCollectionsFromCloud(userId: string): Promise<void> {
    const { data: cloudCollections, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching collections from cloud:', error);
      return;
    }

    if (!cloudCollections) return;

    // Get all local collections including deleted ones
    const dbInstance = await db.getDB();
    const localCollections = await dbInstance.getAll('collections');
    const localMap = new Map(localCollections.map(c => [c.id, c]));

    for (const cloudCol of cloudCollections) {
      const local = localMap.get(cloudCol.id);

      if (!local) {
        // Add new collection from cloud (including soft-deleted ones)
        await dbInstance.put('collections', {
          id: cloudCol.id,
          name: cloudCol.name,
          description: cloudCol.description || '',
          color: cloudCol.color || '#6366f1',
          icon: cloudCol.icon || 'folder',
          order: cloudCol.order || 0,
          isDeleted: cloudCol.is_deleted || false,
          deletedAt: cloudCol.deleted_at ? new Date(cloudCol.deleted_at).getTime() : undefined,
          createdAt: new Date(cloudCol.created_at).getTime(),
          lastModifiedAt: new Date(cloudCol.last_modified_at).getTime(),
        });
      } else {
        // Update if cloud version is newer
        const cloudTime = new Date(cloudCol.last_modified_at).getTime();
        if (cloudTime > local.lastModifiedAt) {
          await dbInstance.put('collections', {
            ...local,
            name: cloudCol.name,
            description: cloudCol.description || '',
            color: cloudCol.color || '#6366f1',
            icon: cloudCol.icon || local.icon || 'folder',
            order: cloudCol.order || 0,
            isDeleted: cloudCol.is_deleted || false,
            deletedAt: cloudCol.deleted_at ? new Date(cloudCol.deleted_at).getTime() : undefined,
            lastModifiedAt: cloudTime,
          });
        }
      }
    }
  }

  // Sync bookmarks from local to Supabase
  async syncBookmarksToCloud(userId: string): Promise<void> {
    // Get all bookmarks including deleted ones for sync
    const dbInstance = await db.getDB();
    const allBookmarks = await dbInstance.getAll('bookmarks');

    for (const bookmark of allBookmarks) {
      try {
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('id', bookmark.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          // Update if local version is newer
          if (bookmark.lastModifiedAt > new Date(existing.last_modified_at).getTime()) {
            await supabase
              .from('bookmarks')
              .update({
                url: bookmark.url,
                title: bookmark.title,
                description: bookmark.description,
                collection_id: bookmark.collectionId,
                favicon: bookmark.favicon,
                is_deleted: bookmark.isDeleted || false,
                deleted_at: bookmark.deletedAt ? new Date(bookmark.deletedAt).toISOString() : null,
                last_modified_at: new Date(bookmark.lastModifiedAt).toISOString(),
              })
              .eq('id', bookmark.id)
              .eq('user_id', userId);
          }
        } else {
          // Insert new bookmark
          // Convert timestamps to ISO strings for PostgreSQL
          const bookmarkData = {
            id: bookmark.id,
            user_id: userId,
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description || '',
            collection_id: bookmark.collectionId,
            favicon: bookmark.favicon || null,
            is_deleted: bookmark.isDeleted || false,
            deleted_at: bookmark.deletedAt ? new Date(bookmark.deletedAt).toISOString() : null,
            created_at: new Date(bookmark.createdAt).toISOString(),
            last_modified_at: new Date(bookmark.lastModifiedAt).toISOString(),
          };

          const { error: insertError } = await supabase.from('bookmarks').insert(bookmarkData);

          if (insertError) {
            console.error('Error inserting bookmark:', bookmark.id, insertError);
            throw insertError;
          }
        }
      } catch (error) {
        console.error('Error syncing bookmark:', bookmark.id, error);
        // Continue with next bookmark instead of failing completely
      }
    }
  }

  // Sync bookmarks from Supabase to local
  async syncBookmarksFromCloud(userId: string): Promise<void> {
    const { data: cloudBookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bookmarks from cloud:', error);
      return;
    }

    if (!cloudBookmarks) return;

    // Get all local bookmarks including deleted ones
    const dbInstance = await db.getDB();
    const localBookmarks = await dbInstance.getAll('bookmarks');
    const localMap = new Map(localBookmarks.map(b => [b.id, b]));

    for (const cloudBm of cloudBookmarks) {
      const local = localMap.get(cloudBm.id);

      if (!local) {
        // Add new bookmark from cloud (including soft-deleted ones)
        await dbInstance.put('bookmarks', {
          id: cloudBm.id,
          url: cloudBm.url,
          title: cloudBm.title,
          description: cloudBm.description || '',
          collectionId: cloudBm.collection_id,
          favicon: cloudBm.favicon,
          isDeleted: cloudBm.is_deleted || false,
          deletedAt: cloudBm.deleted_at ? new Date(cloudBm.deleted_at).getTime() : undefined,
          createdAt: new Date(cloudBm.created_at).getTime(),
          lastModifiedAt: new Date(cloudBm.last_modified_at).getTime(),
        });
      } else {
        // Update if cloud version is newer
        const cloudTime = new Date(cloudBm.last_modified_at).getTime();
        if (cloudTime > local.lastModifiedAt) {
          await dbInstance.put('bookmarks', {
            ...local,
            url: cloudBm.url,
            title: cloudBm.title,
            description: cloudBm.description || '',
            collectionId: cloudBm.collection_id,
            favicon: cloudBm.favicon,
            isDeleted: cloudBm.is_deleted || false,
            deletedAt: cloudBm.deleted_at ? new Date(cloudBm.deleted_at).getTime() : undefined,
            lastModifiedAt: cloudTime,
          });
        }
      }
    }
  }

  // Full sync: both directions
  async fullSync(userId: string): Promise<void> {
    if (this.syncStatus.isSyncing) {
      return;
    }

    try {
      this.syncStatus.isSyncing = true;
      this.syncStatus.error = null;

      // Sync collections first (bookmarks depend on them)
      await this.syncCollectionsFromCloud(userId);
      await this.syncCollectionsToCloud(userId);

      // Then sync bookmarks
      await this.syncBookmarksFromCloud(userId);
      await this.syncBookmarksToCloud(userId);

      this.updateLastSync();

      // Notify subscribers that sync completed
      this.notifySyncComplete();
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown sync error';
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Initial sync when user logs in (cloud -> local)
  async initialSync(userId: string): Promise<void> {
    try {
      this.syncStatus.isSyncing = true;

      // First, get everything from cloud
      await this.syncCollectionsFromCloud(userId);
      await this.syncBookmarksFromCloud(userId);

      // Then push any local changes to cloud
      await this.syncCollectionsToCloud(userId);
      await this.syncBookmarksToCloud(userId);

      this.updateLastSync();

      // Notify subscribers that sync completed
      this.notifySyncComplete();
    } catch (error) {
      console.error('Initial sync error:', error);
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Delete bookmark from cloud
  async deleteBookmarkFromCloud(userId: string, bookmarkId: string): Promise<void> {
    try {
      await supabase.from('bookmarks').delete().eq('id', bookmarkId).eq('user_id', userId);
    } catch (error) {
      console.error('Error deleting bookmark from cloud:', error);
    }
  }

  // Delete collection from cloud (soft delete)
  async deleteCollectionFromCloud(userId: string, collectionId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await supabase
        .from('collections')
        .update({
          is_deleted: true,
          deleted_at: now,
          last_modified_at: now,
        })
        .eq('id', collectionId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error deleting collection from cloud:', error);
    }
  }
}

export const syncService = SyncService.getInstance();
