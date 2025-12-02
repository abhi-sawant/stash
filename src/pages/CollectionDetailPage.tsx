import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import AddBookmarkSheet from '@/components/bookmarks/AddBookmarkSheet';
import MoveToCollectionSheet from '@/components/bookmarks/MoveToCollectionSheet';
import { getCollectionIcon } from '@/components/collections/IconPicker';
import { getColorClass } from '@/components/collections/ColorPicker';
import type { Bookmark } from '@/types';
import { Button } from '@/components/ui/button';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { collections } = useCollections();
  const { bookmarks, loading, deleteBookmark, refresh } = useBookmarks();

  const editSheet = useBottomSheet();
  const moveSheet = useBottomSheet();

  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  const collection = collections.find(c => c.id === collectionId);

  // Filter bookmarks by collection
  const collectionBookmarks = bookmarks.filter(bookmark => bookmark.collectionId === collectionId);

  // Use native app-like navigation (goes back to /collections)
  const { handleBack } = useNavigationHandler();

  const handleEdit = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    editSheet.open();
  };

  const handleMove = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    moveSheet.open();
  };

  const { user } = useAuth();

  const handleShareCollection = () => {
    if (!collection) return;

    // Filter out soft-deleted bookmarks from the collection
    const activeBookmarks = collectionBookmarks.filter(b => !b.isDeleted);

    const exportData = {
      version: '1.0.0',
      type: 'collection-share',
      exportedAt: new Date().toISOString(),
      sharedBy: user?.email || 'unknown',
      collection: {
        name: collection.name,
        description: collection.description,
        icon: collection.icon,
        color: collection.color,
      },
      bookmarks: activeBookmarks,
      stats: {
        totalBookmarks: activeBookmarks.length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = collection.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    link.download = `collection-${fileName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!collection) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Collection not found</p>
        <Button onClick={() => navigate('/collections')} visualSize="lg">
          Back to Collections
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        <div className="flex w-full items-center gap-3">
          <Button onClick={handleBack} visualSize="icon-sm" variant="ghost" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className={`h-10 w-10 rounded-lg ${collection.color ? getColorClass(collection.color) : 'bg-indigo-500'} flex shrink-0 items-center justify-center text-white`}
          >
            {(() => {
              const Icon = getCollectionIcon(collection.icon);
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold">{collection.name}</h1>
            <div className="text-secondary-foreground line-clamp-1 text-xs text-ellipsis">
              <span>
                {collectionBookmarks.length}{' '}
                {collectionBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
              </span>
            </div>
          </div>
          <Button
            onClick={handleShareCollection}
            variant="ghost"
            visualSize="icon-sm"
            aria-label="Share collection"
            title="Share collection"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Bookmarks List */}
      <PullToRefresh onRefresh={refresh}>
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : collectionBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl">{collection.icon || '📚'}</span>
              </div>
              <h3 className="mb-2 text-lg font-medium">No bookmarks yet</h3>
              <p className="text-secondary-foreground mb-6 line-clamp-1 max-w-xs text-sm text-ellipsis">
                Tap the + button to add your first bookmark to this collection
              </p>
            </div>
          ) : (
            <BookmarkGrid
              bookmarks={collectionBookmarks}
              onDelete={deleteBookmark}
              onEdit={handleEdit}
              onMove={handleMove}
            />
          )}
        </>
      </PullToRefresh>

      {/* Edit Bookmark Sheet */}
      <BottomSheet isOpen={editSheet.isOpen} onClose={editSheet.close} title="Edit Bookmark">
        {selectedBookmark && (
          <AddBookmarkSheet editBookmark={selectedBookmark} onClose={editSheet.close} />
        )}
      </BottomSheet>

      {/* Move to Collection Sheet */}
      <BottomSheet isOpen={moveSheet.isOpen} onClose={moveSheet.close} title="Move to Collection">
        {selectedBookmark && (
          <MoveToCollectionSheet bookmark={selectedBookmark} onClose={moveSheet.close} />
        )}
      </BottomSheet>
    </div>
  );
}
