import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCollections } from '@/hooks/useCollections';
import { fetchMetadata, isValidUrl } from '@/lib/metadata';
import { hapticFeedback } from '@/lib/haptics';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { IconPicker, CollectionIconName } from '@/components/collections/IconPicker';
import { ColorPicker } from '@/components/collections/ColorPicker';
import { Label } from '@/components/ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Bookmark } from '@/types';

interface AddBookmarkSheetProps {
  onClose: () => void;
  editBookmark?: Bookmark;
}

export default function AddBookmarkSheet({ onClose, editBookmark }: AddBookmarkSheetProps) {
  const { addBookmark, updateBookmark } = useBookmarks();
  const { collections, addCollection } = useCollections();
  const isEditMode = !!editBookmark;

  const [url, setUrl] = useState(editBookmark?.url || '');
  const [title, setTitle] = useState(editBookmark?.title || '');
  const [description, setDescription] = useState(editBookmark?.description || '');
  const [collectionId, setCollectionId] = useState(editBookmark?.collectionId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [showNewCollectionSheet, setShowNewCollectionSheet] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    icon: 'folder' as CollectionIconName,
    color: '#6366f1',
  });

  // Auto-fetch metadata when URL changes
  useEffect(() => {
    const fetchMetadataAuto = async () => {
      if (url && isValidUrl(url)) {
        setIsFetchingMetadata(true);
        try {
          const metadata = await fetchMetadata(url);
          setTitle(metadata.title);
          setDescription(metadata.description || '');
        } catch (error) {
          console.error('Failed to fetch metadata:', error);
        } finally {
          setIsFetchingMetadata(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchMetadataAuto();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      hapticFeedback.light();
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleAddCollection = async () => {
    if (!newCollection.name.trim()) return;

    try {
      const createdCollection = await addCollection({
        name: newCollection.name.trim(),
        description: newCollection.description.trim(),
        icon: newCollection.icon,
        color: newCollection.color,
        order: collections.length,
      });

      hapticFeedback.success();
      // Set the newly created collection as selected
      setCollectionId(createdCollection.id);
      // Reset and close the sheet
      setNewCollection({ name: '', description: '', icon: 'folder', color: '#6366f1' });
      setShowNewCollectionSheet(false);
    } catch (err) {
      console.error('Failed to add collection:', err);
      hapticFeedback.error();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim() || !collectionId) return;

    setIsLoading(true);
    hapticFeedback.light();

    try {
      if (isEditMode && editBookmark) {
        // Update existing bookmark
        await updateBookmark(editBookmark.id, {
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          collectionId: collectionId,
        });
      } else {
        // Add new bookmark
        const metadata = await fetchMetadata(url.trim());

        await addBookmark({
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          favicon: metadata.favicon,
          thumbnail: metadata.thumbnail,
          collectionId: collectionId,
        });
      }

      hapticFeedback.success();
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} bookmark:`, error);
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* URL Field */}
      <div>
        <Label htmlFor="url">
          Link <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            disabled={isLoading}
            visualSize="lg"
            required
          />
          {!isEditMode && (
            <Button type="button" onClick={handlePaste} visualSize="lg" disabled={isLoading}>
              Paste
            </Button>
          )}
        </div>
        {isFetchingMetadata && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Fetching metadata...
          </p>
        )}
      </div>

      {/* Title Field */}
      <div>
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Bookmark title"
          disabled={isLoading || isFetchingMetadata}
          visualSize="lg"
          required
        />
      </div>

      {/* Description Field */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
          visualSize="lg"
          disabled={isLoading || isFetchingMetadata}
        />
      </div>

      {/* Collection Select */}
      <div>
        <Label htmlFor="collection">
          Collection <span className="text-red-500">*</span>
        </Label>
        {collections.length === 0 ? (
          <div className="space-y-2">
            <div className="border-border bg-card text-secondary-foreground rounded-lg border px-4 py-3 text-sm">
              No collections yet. Create one to organize your bookmarks.
            </div>
            <Button type="button" onClick={() => setShowNewCollectionSheet(true)}>
              <Plus className="h-5 w-5" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Select
              value={collectionId}
              onValueChange={value => {
                if (value === 'ADD_NEW') {
                  setShowNewCollectionSheet(true);
                } else {
                  setCollectionId(value);
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger visualSize="lg" id="collection">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map(collection => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
                <SelectItem value="ADD_NEW">➕ Add new collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        visualSize="lg"
        className="w-full"
        disabled={!url.trim() || !title.trim() || !collectionId || isLoading || isFetchingMetadata}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isEditMode ? 'Saving...' : 'Adding...'}
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            {isEditMode ? 'Save Changes' : 'Add Bookmark'}
          </>
        )}
      </Button>

      {/* New Collection Bottom Sheet */}
      <BottomSheet
        isOpen={showNewCollectionSheet}
        onClose={() => {
          setShowNewCollectionSheet(false);
          setNewCollection({ name: '', description: '', icon: 'folder', color: '#6366f1' });
        }}
        title="New Collection"
      >
        <div className="space-y-4 p-4">
          <div>
            <Label htmlFor="new-collection-name">
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-collection-name"
              type="text"
              visualSize="lg"
              placeholder="Collection title"
              value={newCollection.name}
              onChange={e => setNewCollection({ ...newCollection, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="new-collection-description">Description</Label>
            <Textarea
              id="new-collection-description"
              value={newCollection.description}
              onChange={e => setNewCollection({ ...newCollection, description: e.target.value })}
              rows={3}
              visualSize="lg"
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label>Icon</Label>
            <IconPicker
              selectedIcon={newCollection.icon}
              onSelectIcon={icon => setNewCollection({ ...newCollection, icon })}
            />
          </div>
          <div>
            <Label>Color</Label>
            <ColorPicker
              selectedColor={newCollection.color}
              onColorSelect={color => setNewCollection({ ...newCollection, color })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={() => {
                setShowNewCollectionSheet(false);
                setNewCollection({ name: '', description: '', icon: 'folder', color: '#6366f1' });
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCollection}
              disabled={!newCollection.name.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </BottomSheet>
    </form>
  );
}
