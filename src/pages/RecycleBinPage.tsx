import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, RefreshCw, Folder, Bookmark as BookmarkIcon } from 'lucide-react';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import * as db from '@/lib/db';
import { syncService } from '@/lib/sync';
import type { Bookmark, Collection } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RecycleBinPage() {
  const { user } = useAuth();
  const { handleBack } = useNavigationHandler();
  const [deletedBookmarks, setDeletedBookmarks] = useState<Bookmark[]>([]);
  const [deletedCollections, setDeletedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    try {
      setLoading(true);
      const [bookmarks, collections] = await Promise.all([
        db.getDeletedBookmarks(),
        db.getDeletedCollections(),
      ]);
      setDeletedBookmarks(bookmarks);
      setDeletedCollections(collections);
    } catch (error) {
      console.error('Error loading deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBookmark = async (id: string) => {
    try {
      await db.restoreBookmark(id);

      // Sync to cloud if user is logged in
      if (user) {
        await syncService.syncBookmarksToCloud(user.id);
      }

      setDeletedBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error restoring bookmark:', error);
    }
  };

  const handleRestoreCollection = async (id: string) => {
    try {
      await db.restoreCollection(id);

      // Sync to cloud if user is logged in
      if (user) {
        await syncService.syncCollectionsToCloud(user.id);
      }

      setDeletedCollections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error restoring collection:', error);
    }
  };

  const handlePermanentDeleteBookmark = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this bookmark? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await db.permanentlyDeleteBookmark(id);

      // Delete from cloud if user is logged in
      if (user) {
        await syncService.deleteBookmarkFromCloud(user.id, id);
      }

      setDeletedBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error permanently deleting bookmark:', error);
    }
  };

  const handlePermanentDeleteCollection = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this collection? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await db.permanentlyDeleteCollection(id);

      // Delete from cloud if user is logged in
      if (user) {
        await syncService.deleteCollectionFromCloud(user.id, id);
      }

      setDeletedCollections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error permanently deleting collection:', error);
    }
  };

  const handleEmptyRecycleBin = async () => {
    if (
      !confirm(
        'Are you sure you want to permanently delete all items in the recycle bin? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await db.emptyRecycleBin();

      // Sync to cloud if user is logged in
      if (user) {
        await Promise.all([
          syncService.syncBookmarksToCloud(user.id),
          syncService.syncCollectionsToCloud(user.id),
        ]);
      }

      setDeletedBookmarks([]);
      setDeletedCollections([]);
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
    }
  };

  const getDaysRemaining = (deletedAt?: number) => {
    if (!deletedAt) return 7;
    const daysPassed = Math.floor((Date.now() - deletedAt) / (24 * 60 * 60 * 1000));
    return Math.max(0, 7 - daysPassed);
  };

  const totalItems = deletedBookmarks.length + deletedCollections.length;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        <div className="flex grow items-center gap-3">
          <Button onClick={handleBack} variant="ghost" visualSize="icon-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">Recycle Bin</h1>
            <p className="text-secondary-foreground line-clamp-1 text-xs text-ellipsis">
              Automatically deleted after 7 days
            </p>
          </div>
        </div>
        {totalItems > 0 && (
          <Button
            onClick={handleEmptyRecycleBin}
            variant="destructive"
            visualSize="icon-sm"
            title="Empty Recycle Bin"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-2 pb-34 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : totalItems === 0 ? (
          <div className="py-12 text-center">
            <Trash2 className="text-secondary-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-medium">Recycle bin is empty</h3>
            <p className="text-secondary-foreground">Deleted items will appear here</p>
          </div>
        ) : (
          <Tabs defaultValue="bookmarks" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="bookmarks" className="flex-1">
                Bookmarks ({deletedBookmarks.length})
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex-1">
                Collections ({deletedCollections.length})
              </TabsTrigger>
            </TabsList>

            {/* Bookmarks Tab Content */}
            <TabsContent value="bookmarks" className="space-y-3">
              {deletedBookmarks.map(bookmark => (
                <div key={bookmark.id} className="border-border bg-card rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <BookmarkIcon className="text-secondary-foreground mt-0.5 h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-medium">{bookmark.title}</h3>
                      <p className="text-secondary-foreground mt-1 line-clamp-1 truncate text-xs text-ellipsis">
                        {bookmark.url}
                      </p>
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                        {getDaysRemaining(bookmark.deletedAt)} days remaining
                      </p>
                    </div>
                    <div className="grid items-center gap-2">
                      <Button
                        onClick={() => handleRestoreBookmark(bookmark.id)}
                        variant="secondary"
                        visualSize="icon-sm"
                        title="Restore"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handlePermanentDeleteBookmark(bookmark.id)}
                        variant="destructive"
                        visualSize="icon-sm"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Collections Tab Content */}
            <TabsContent value="collections" className="space-y-3">
              {deletedCollections.map(collection => (
                <div key={collection.id} className="border-border bg-card rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: collection.color || '#6366f1' }}
                    >
                      <Folder className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-secondary-foreground mt-1 line-clamp-1 text-xs text-ellipsis">
                          {collection.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                        {getDaysRemaining(collection.deletedAt)} days remaining
                      </p>
                    </div>
                    <div className="grid items-center gap-2">
                      <Button
                        onClick={() => handleRestoreCollection(collection.id)}
                        title="Restore"
                        variant="secondary"
                        visualSize="icon-sm"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handlePermanentDeleteCollection(collection.id)}
                        title="Delete permanently"
                        variant="destructive"
                        visualSize="icon-sm"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
