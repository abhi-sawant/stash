import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, FolderInput, Globe } from 'lucide-react';
import type { Bookmark } from '@/types';
import { formatDate, getDomainFromUrl } from '@/lib/utils';
import { thumbnailService } from '@/lib/thumbnailService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onToggleArchive?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  onMove?: (bookmark: Bookmark) => void;
}

export function BookmarkCard({ bookmark, onDelete, onEdit, onMove }: BookmarkCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleClick = () => {
    window.open(bookmark.url, '_blank');
  };

  const handleDeleteConfirm = () => {
    onDelete(bookmark.id);
    setShowDeleteDialog(false);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-card border-input flex cursor-pointer overflow-hidden rounded-lg border shadow-xs transition-all active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="border-e-input w-28 shrink-0 border-e">
        {bookmark.thumbnail ? (
          <img
            src={bookmark.thumbnail}
            alt={bookmark.title}
            className="h-full max-h-43 w-full object-cover"
            loading="lazy"
            onError={e => {
              // If thumbnail fails to load, hide it
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Globe className="text-muted-foreground h-16 w-16" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grow p-2 ps-3">
        {/* Header with favicon and domain */}
        <div className="mb-2 flex items-center gap-2">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="h-4 w-4 rounded"
              loading="lazy"
              onError={e => {
                // If favicon fails to load, use fallback
                e.currentTarget.src = thumbnailService.getDefaultFavicon(bookmark.url);
              }}
            />
          ) : (
            <div className="bg-muted flex h-4 w-4 items-center justify-center rounded">
              <Globe className="text-muted-foreground h-3 w-3" />
            </div>
          )}
          <span className="text-muted-foreground line-clamp-1 truncate text-xs text-ellipsis">
            {getDomainFromUrl(bookmark.url)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{bookmark.title}</h3>

        {/* Description */}
        {bookmark.description && (
          <p className="text-muted-foreground mb-3 line-clamp-2 text-xs wrap-anywhere">
            {bookmark.description}
          </p>
        )}

        {/* Footer */}
        <div className="border-input flex items-center justify-between border-t pt-1">
          <span className="text-muted-foreground text-xs">{formatDate(bookmark.createdAt)}</span>

          <div className="flex items-center gap-2">
            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  visualSize="icon-sm"
                  className="text-muted-foreground touch-manipulation transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onEdit(bookmark);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                {onMove && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onMove(bookmark);
                    }}
                  >
                    <FolderInput className="h-4 w-4" />
                    <span>Move to collection</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                  <span className="text-destructive">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Bookmark</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{bookmark.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
