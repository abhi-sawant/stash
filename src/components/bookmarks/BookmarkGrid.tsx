import type { Bookmark } from '@/types';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  onMove?: (bookmark: Bookmark) => void;
  onSelect?: (id: string) => void;
  selectedIds?: string[];
}

export function BookmarkGrid({ bookmarks, onDelete, onEdit, onMove }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="text-muted-foreground mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">No bookmarks yet</h3>
        <p className="text-muted-foreground line-clamp-1 max-w-xs text-center text-sm text-ellipsis">
          Start saving your bookmarks by tapping the + button below
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map(bookmark => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onEdit={onEdit}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
