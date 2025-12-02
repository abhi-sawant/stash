import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import AddBookmarkSheet from '@/components/bookmarks/AddBookmarkSheet';
import MoveToCollectionSheet from '@/components/bookmarks/MoveToCollectionSheet';
import type { Bookmark } from '@/types';
import { Input } from '@/components/ui/input';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { bookmarks, deleteBookmark } = useBookmarks();
  const editSheet = useBottomSheet();
  const moveSheet = useBottomSheet();
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Handle browser back button - navigate to home
  useNavigationHandler();

  const handleEdit = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    editSheet.open();
  };

  const handleMove = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    moveSheet.open();
  };

  // Search bookmarks by title, description, URL
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();

    return bookmarks.filter(bookmark => {
      const titleMatch = bookmark.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = bookmark.description?.toLowerCase().includes(searchTerm);
      const urlMatch = bookmark.url.toLowerCase().includes(searchTerm);

      return titleMatch || descriptionMatch || urlMatch;
    });
  }, [bookmarks, query]);

  return (
    <>
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        {/* Search input */}
        <Search className="text-secondary-foreground absolute top-1/2 left-7 h-5 w-5 -translate-y-1/2" />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="grow ps-10"
          autoFocus
        />
      </header>

      {/* Content */}
      <>
        {!query ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="text-secondary-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">Search your bookmarks</h3>
            <p className="text-secondary-foreground max-w-xs text-center text-sm">
              Find bookmarks by title, description, or URL
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="h-[calc(100dvh-131px)] overflow-auto">
            <BookmarkGrid
              bookmarks={searchResults}
              onEdit={handleEdit}
              onMove={handleMove}
              onDelete={deleteBookmark}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="text-secondary-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">No results found</h3>
            <p className="text-secondary-foreground max-w-xs text-center text-sm">
              No bookmarks match "{query}"
            </p>
          </div>
        )}
      </>

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
    </>
  );
}
