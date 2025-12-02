import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollections';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import { FolderOpen, Plus, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { ConfirmDialog } from '@/components/mobile/ConfirmDialog';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { hapticFeedback } from '@/lib/haptics';
import {
  IconPicker,
  CollectionIconName,
  getCollectionIcon,
} from '@/components/collections/IconPicker';
import { ColorPicker, getColorClass } from '@/components/collections/ColorPicker';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { collections, loading, deleteCollection, updateCollection, addCollection } =
    useCollections();
  const { bookmarks } = useBookmarks();

  // Handle browser back button - navigate to home
  useNavigationHandler();
  const collectionFormSheet = useBottomSheet();
  const [collectionForm, setCollectionForm] = useState<{
    id?: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  }>({
    name: '',
    description: '',
    icon: 'folder',
    color: '#6366f1',
  });
  const isEditing = !!collectionForm.id;
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
    hasBookmarks: boolean;
  } | null>(null);

  // Count bookmarks per collection
  const getBookmarkCount = (collectionId: string) => {
    return bookmarks.filter(b => b.collectionId === collectionId).length;
  };

  const handleCollectionClick = (collectionId: string) => {
    hapticFeedback.light();
    navigate(`/collections/${collectionId}`);
  };

  const handleEdit = (collection: (typeof collections)[0]) => {
    setCollectionForm({
      id: collection.id,
      name: collection.name,
      description: collection.description || '',
      icon: collection.icon || 'folder',
      color: collection.color || '#6366f1',
    });
    collectionFormSheet.open();
  };

  const handleSaveCollection = async () => {
    if (!collectionForm.name.trim()) return;

    try {
      if (isEditing && collectionForm.id) {
        await updateCollection(collectionForm.id, {
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim(),
          icon: collectionForm.icon,
          color: collectionForm.color,
        });
      } else {
        await addCollection({
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim(),
          icon: collectionForm.icon,
          color: collectionForm.color,
          order: collections.length,
        });
      }
      hapticFeedback.success();
      handleCloseForm();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'add'} collection:`, error);
      hapticFeedback.error();
    }
  };

  const handleDeleteClick = (collection: (typeof collections)[0]) => {
    const bookmarkCount = getBookmarkCount(collection.id);
    setDeleteConfirm({
      id: collection.id,
      name: collection.name,
      hasBookmarks: bookmarkCount > 0,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteCollection(deleteConfirm.id);
      hapticFeedback.success();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      hapticFeedback.error();
    }
  };

  const handleCloseForm = () => {
    collectionFormSheet.close();
    setCollectionForm({
      name: '',
      description: '',
      icon: 'folder',
      color: '#6366f1',
    });
  };

  const handleOpenAddForm = () => {
    setCollectionForm({
      name: '',
      description: '',
      icon: 'folder',
      color: '#6366f1',
    });
    collectionFormSheet.open();
  };

  const { user } = useAuth();

  const handleShareCollection = (collection: (typeof collections)[0]) => {
    // Filter bookmarks for this collection, excluding soft-deleted ones
    const collectionBookmarks = bookmarks.filter(
      b => b.collectionId === collection.id && !b.isDeleted
    );

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
      bookmarks: collectionBookmarks,
      stats: {
        totalBookmarks: collectionBookmarks.length,
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
    hapticFeedback.success();
  };

  return (
    <>
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        <div className="flex grow items-center justify-between">
          <h1 className="text-2xl font-bold">Collections</h1>
          {collections.length > 0 && (
            <Button visualSize="md" onClick={handleOpenAddForm}>
              <Plus className="h-3 w-3" />
              New Collection
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="h-[calc(100dvh-133px)] overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="text-secondary-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">No collections yet</h3>
            <p className="text-secondary-foreground mb-4 max-w-xs text-center text-sm">
              Create collections to organize your bookmarks. A default "All" collection will be
              created when you add your first bookmark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map(collection => (
              <div
                key={collection.id}
                className="border-border bg-card relative cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md active:scale-95"
                onClick={() => handleCollectionClick(collection.id)}
              >
                <div
                  className={`flex items-start justify-between ${collection.description ? 'mb-3' : ''}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-lg ${collection.color ? getColorClass(collection.color) : 'bg-indigo-500'} flex shrink-0 items-center justify-center text-white`}
                    >
                      {(() => {
                        const Icon = getCollectionIcon(collection.icon);
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold">{collection.name}</h3>
                      <p className="text-secondary-foreground line-clamp-1 text-sm text-ellipsis">
                        {getBookmarkCount(collection.id)}{' '}
                        {getBookmarkCount(collection.id) === 1 ? 'bookmark' : 'bookmarks'}
                      </p>
                    </div>
                  </div>

                  {/* Three-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        visualSize="icon-sm"
                        className="text-muted-foreground touch-manipulation transition-colors"
                        aria-label="Collection options"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleShareCollection(collection);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(collection);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(collection);
                        }}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                        <span className="text-destructive">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {collection.description && (
                  <p className="text-secondary-foreground line-clamp-2 text-sm">
                    {collection.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Form (Add/Edit) */}
      <BottomSheet
        isOpen={collectionFormSheet.isOpen}
        onClose={handleCloseForm}
        title={isEditing ? 'Edit Collection' : 'New Collection'}
      >
        <div className="space-y-4 p-4">
          <div>
            <Label htmlFor="collection-name">
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              visualSize="lg"
              id="collection-name"
              type="text"
              value={collectionForm.name}
              onChange={e => setCollectionForm({ ...collectionForm, name: e.target.value })}
              placeholder={isEditing ? 'Collection name' : 'e.g., Food Recipes, Travel Plans'}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              visualSize="lg"
              id="collection-description"
              value={collectionForm.description}
              onChange={e => setCollectionForm({ ...collectionForm, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div>
            <Label>Icon</Label>
            <IconPicker
              selectedIcon={collectionForm.icon as CollectionIconName}
              onSelectIcon={icon => setCollectionForm({ ...collectionForm, icon })}
            />
          </div>
          <div>
            <Label>Color</Label>
            <ColorPicker
              selectedColor={collectionForm.color}
              onColorSelect={color => setCollectionForm({ ...collectionForm, color })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button visualSize="lg" onClick={handleCloseForm} variant="secondary">
              Cancel
            </Button>
            <Button
              visualSize="lg"
              onClick={handleSaveCollection}
              disabled={!collectionForm.name.trim()}
            >
              {isEditing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deleteConfirm?.name}"?`}
        message={
          deleteConfirm?.hasBookmarks
            ? `This collection contains ${getBookmarkCount(deleteConfirm.id)} bookmark${
                getBookmarkCount(deleteConfirm.id) === 1 ? '' : 's'
              }. Deleting it will not delete the bookmarks, but they will need to be reassigned to another collection.`
            : 'This collection is empty and will be permanently deleted.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
