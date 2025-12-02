import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Loader2 } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCollections } from '@/hooks/useCollections';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCollectionIcon } from '@/components/collections/IconPicker';

export default function ShareTargetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addBookmark } = useBookmarks();
  const { collections } = useCollections();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get shared data from URL parameters
    const sharedTitle = searchParams.get('title') || '';
    const sharedText = searchParams.get('text') || '';
    const sharedUrl = searchParams.get('url') || '';

    // Try to extract URL from text if url param is empty
    let finalUrl = sharedUrl;
    if (!finalUrl && sharedText) {
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        finalUrl = urlMatch[0];
      }
    }

    setTitle(sharedTitle || 'Shared Link');
    setUrl(finalUrl);
    setDescription(sharedText);

    // Set default collection to Miscellaneous
    const miscCollection = collections.find(c => c.name === 'Miscellaneous');
    if (miscCollection) {
      setSelectedCollection(miscCollection.id);
    }
  }, [searchParams, collections]);

  const handleSave = async () => {
    if (!url) {
      alert('No URL to save');
      return;
    }

    setIsSaving(true);
    try {
      await addBookmark({
        url,
        title: title || 'Shared Link',
        description,
        collectionId: selectedCollection || collections[0]?.id || '',
      });

      // Navigate to home after saving
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error saving bookmark:', error);
      alert('Failed to save bookmark');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        <Button onClick={handleCancel} variant="ghost" disabled={isSaving}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Bookmark className="h-5 w-5 text-indigo-600" />
          Save Bookmark
        </h1>
      </header>

      {/* Form */}
      <div className="space-y-4 p-4">
        {/* URL Display */}
        <div className="bg-card rounded-lg p-4 shadow-xs">
          <Label>URL</Label>
          <Input visualSize="lg" value={url || 'No URL provided'} readOnly />
        </div>

        {/* Title Input */}
        <div className="rounded-lg bg-white p-4 shadow-xs">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            visualSize="lg"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter bookmark title"
            disabled={isSaving}
          />
        </div>

        {/* Description Input */}
        <div className="rounded-lg bg-white p-4 shadow-xs">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            visualSize="lg"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Add a description"
            disabled={isSaving}
          />
        </div>

        {/* Collection Select */}
        <div className="bg-card rounded-lg p-4 shadow-xs">
          <Label htmlFor="collection">Collection</Label>
          <Select
            value={selectedCollection}
            onValueChange={setSelectedCollection}
            disabled={isSaving}
          >
            <SelectTrigger visualSize="lg" id="collection" className="w-full">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map(collection => {
                const Icon = getCollectionIcon(collection.icon);
                return (
                  <SelectItem key={collection.id} value={collection.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{collection.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button onClick={handleCancel} variant="secondary" visualSize="lg" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} visualSize="lg" disabled={isSaving || !url}>
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Bookmark'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
