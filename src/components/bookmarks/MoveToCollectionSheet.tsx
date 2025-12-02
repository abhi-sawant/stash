import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCollections } from '@/hooks/useCollections';
import { hapticFeedback } from '@/lib/haptics';
import type { Bookmark } from '@/types';
import { Button } from '../ui/button';

interface MoveToCollectionSheetProps {
  bookmark: Bookmark;
  onClose: () => void;
}

export default function MoveToCollectionSheet({ bookmark, onClose }: MoveToCollectionSheetProps) {
  const { updateBookmark } = useBookmarks();
  const { collections } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState(bookmark.collectionId);
  const [isLoading, setIsLoading] = useState(false);

  const handleMove = async (collectionId: string) => {
    if (collectionId === bookmark.collectionId) {
      onClose();
      return;
    }

    setIsLoading(true);
    hapticFeedback.light();

    try {
      await updateBookmark(bookmark.id, {
        collectionId: collectionId,
      });

      hapticFeedback.success();
      onClose();
    } catch (error) {
      console.error('Failed to move bookmark:', error);
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Current Bookmark Info */}
      <div className="border-border border-b pb-4">
        <h3 className="mb-1 line-clamp-1 font-semibold">{bookmark.title}</h3>
        <p className="text-muted-foreground line-clamp-1 text-sm text-ellipsis">{bookmark.url}</p>
      </div>

      {/* Collections List */}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {collections.map(collection => {
          const isCurrentCollection = collection.id === bookmark.collectionId;
          const isSelected = collection.id === selectedCollectionId;

          return (
            <button
              key={collection.id}
              onClick={() => {
                setSelectedCollectionId(collection.id);
                handleMove(collection.id);
              }}
              disabled={isLoading}
              className={`flex w-full touch-manipulation items-center gap-3 rounded-lg border p-4 transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
              } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div
                className={`h-10 w-10 rounded-lg ${
                  collection.color || 'bg-primary'
                } flex shrink-0 items-center justify-center`}
              >
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium">{collection.name}</p>
                {collection.description && (
                  <p className="text-muted-foreground line-clamp-1 truncate text-sm text-ellipsis">
                    {collection.description}
                  </p>
                )}
              </div>
              {isCurrentCollection && (
                <span className="bg-accent rounded-full px-2 py-1 text-xs">Current</span>
              )}
              {isSelected && !isCurrentCollection && (
                <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cancel Button */}
      <Button onClick={onClose} disabled={isLoading} className="w-full" visualSize="lg">
        Cancel
      </Button>
    </div>
  );
}
