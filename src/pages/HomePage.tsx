import { useState } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { ConfirmDialog } from '@/components/mobile/ConfirmDialog';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import AddBookmarkSheet from '@/components/bookmarks/AddBookmarkSheet';
import MoveToCollectionSheet from '@/components/bookmarks/MoveToCollectionSheet';
import type { Bookmark } from '@/types';

export default function HomePage() {
  const { bookmarks, loading, deleteBookmark, refresh } = useBookmarks();
  const editSheet = useBottomSheet();
  const moveSheet = useBottomSheet();

  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Enable native app-like back button behavior (exit app from home)
  const { shouldShowExitConfirm, confirmExit, cancelExit } = useNavigationHandler({
    isHomePage: true,
  });

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refresh();
  };

  const handleEdit = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    editSheet.open();
  };

  const handleMove = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    moveSheet.open();
  };

  return (
    <>
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center gap-2 border-b px-4">
        <h1 className="grow text-2xl font-bold">Bookmarks</h1>
      </header>

      {/* Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : (
          <BookmarkGrid
            bookmarks={bookmarks}
            onDelete={deleteBookmark}
            onEdit={handleEdit}
            onMove={handleMove}
          />
        )}
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

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={shouldShowExitConfirm}
        onClose={cancelExit}
        onConfirm={confirmExit}
        title="Exit App"
        message="Are you sure you want to exit?"
        confirmText="Exit"
        cancelText="Stay"
        variant="info"
      />
    </>
  );
}
