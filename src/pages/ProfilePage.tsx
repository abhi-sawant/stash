import { useState, useRef, useEffect } from 'react';
import {
  Edit2,
  Download,
  Upload,
  LogOut,
  X,
  Check,
  RefreshCw,
  Smartphone,
  Trash,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCollections } from '@/hooks/useCollections';
import { useNavigate } from 'react-router-dom';
import { useNavigationHandler } from '@/hooks/useNavigationHandler';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { bookmarks, addBookmark } = useBookmarks();
  const { collections, addCollection } = useCollections();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  // Handle browser back button - navigate to home
  useNavigationHandler();

  const [userName, setUserName] = useState(user?.user_metadata?.display_name || '');
  const [editNameValue, setEditNameValue] = useState(userName);
  const [saving, setSaving] = useState(false);

  const editNameSheet = useBottomSheet();

  // Load display name from user metadata on mount and when user changes
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setUserName(user.user_metadata.display_name);
    }
  }, [user]);

  // Get user initials for avatar
  const getInitials = () => {
    if (userName) {
      return userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Handle name save
  const handleSaveName = async () => {
    if (!editNameValue.trim()) {
      alert('Please enter a valid name');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: editNameValue.trim() },
      });

      if (error) throw error;

      setUserName(editNameValue.trim());
      editNameSheet.close();
      alert('Display name updated successfully!');
    } catch (error) {
      console.error('Failed to update display name:', error);
      alert(
        `Failed to update display name: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  // Handle export bookmarks
  const handleExport = () => {
    // Filter out soft-deleted items from export
    const activeBookmarks = bookmarks.filter(b => !b.isDeleted);
    const activeCollections = collections.filter(c => !c.isDeleted);

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || 'unknown',
      bookmarks: activeBookmarks,
      collections: activeCollections,
      stats: {
        totalBookmarks: activeBookmarks.length,
        totalCollections: activeCollections.length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle import bookmarks
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let importedCollections = 0;
      let importedBookmarks = 0;
      let skippedCollections = 0;
      let skippedBookmarks = 0;
      const errors: string[] = [];
      let newCollectionId: string | undefined;

      // Check if this is a shared collection import
      const isCollectionShare = data.type === 'collection-share' && data.collection;

      if (isCollectionShare) {
        // Import the shared collection
        const sharedCollection = data.collection;

        try {
          const newCollection = await addCollection({
            name: sharedCollection.name,
            description: sharedCollection.description || '',
            color: sharedCollection.color || '#6366f1',
            icon: sharedCollection.icon || 'folder',
            order: collections.length,
          });
          newCollectionId = newCollection.id;
          importedCollections++;
        } catch (error) {
          // If collection already exists, try to find it
          if (error instanceof Error && error.message.includes('already exists')) {
            const existingCollection = collections.find(
              c => c.name.toLowerCase() === sharedCollection.name.toLowerCase()
            );
            if (existingCollection) {
              newCollectionId = existingCollection.id;
              skippedCollections++;
            } else {
              errors.push(`Collection "${sharedCollection.name}": ${error.message}`);
            }
          } else {
            errors.push(
              `Collection "${sharedCollection.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } else {
        // Import collections from full export
        if (data.collections && Array.isArray(data.collections)) {
          for (const collection of data.collections) {
            // Skip if it's the default Miscellaneous collection
            if (collection.name === 'Miscellaneous') {
              skippedCollections++;
              continue;
            }

            // Skip soft-deleted collections
            if (collection.isDeleted) {
              skippedCollections++;
              continue;
            }

            try {
              await addCollection({
                name: collection.name,
                description: collection.description || '',
                color: collection.color || '#6366f1',
                icon: collection.icon || 'folder',
                order: collection.order || 0,
              });
              importedCollections++;
            } catch (error) {
              // If collection already exists, skip it
              if (error instanceof Error && error.message.includes('already exists')) {
                skippedCollections++;
              } else {
                errors.push(
                  `Collection "${collection.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }
          }
        }
      }

      // Import bookmarks
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        // Get the default collection as fallback
        const defaultCollection = collections.find(c => c.name === 'Miscellaneous');

        for (const bookmark of data.bookmarks) {
          // Skip soft-deleted bookmarks
          if (bookmark.isDeleted) {
            skippedBookmarks++;
            continue;
          }

          // Determine collection ID
          let targetCollectionId = bookmark.collectionId;

          // If importing a shared collection, use the new collection ID
          if (isCollectionShare && newCollectionId) {
            targetCollectionId = newCollectionId;
          } else if (!targetCollectionId && defaultCollection) {
            targetCollectionId = defaultCollection.id;
          }

          try {
            await addBookmark({
              url: bookmark.url,
              title: bookmark.title || 'Imported Bookmark',
              description: bookmark.description || '',
              collectionId: targetCollectionId,
              favicon: bookmark.favicon,
            });
            importedBookmarks++;
          } catch (error) {
            errors.push(
              `Bookmark "${bookmark.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      // Show detailed results
      let message = isCollectionShare ? `Collection imported!\n\n` : `Import completed!\n\n`;

      if (isCollectionShare) {
        message += `📁 Collection: ${data.collection.name}\n`;
        message += `✅ Bookmarks imported: ${importedBookmarks}\n`;
        if (data.sharedBy) {
          message += `👤 Shared by: ${data.sharedBy}\n`;
        }
      } else {
        message += `✅ Collections imported: ${importedCollections}\n`;
        message += `✅ Bookmarks imported: ${importedBookmarks}\n`;
      }

      if (skippedCollections > 0) {
        message += `⏭️  Collections skipped: ${skippedCollections}\n`;
      }
      if (skippedBookmarks > 0) {
        message += `⏭️  Bookmarks skipped: ${skippedBookmarks}\n`;
      }

      if (errors.length > 0) {
        message += `\n⚠️  Errors (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... and ${errors.length - 5} more`;
        }
      }

      alert(message);
    } catch (error) {
      console.error('Import error:', error);
      alert(
        `Failed to import: ${error instanceof Error ? error.message : 'Please check the file format.'}`
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 w-full items-center border-b px-4">
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      {/* Content */}
      <div className="pb-safe-bottom flex-1 overflow-y-auto">
        {/* User info */}
        <div className="border-border bg-card border-b px-6 py-2">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
              {getInitials()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {userName || user?.email?.split('@')[0] || 'User'}
                </h2>
                <Button
                  onClick={() => {
                    setEditNameValue(userName);
                    editNameSheet.open();
                  }}
                  variant="ghost"
                  visualSize="icon-sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-secondary-foreground text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2 p-4 pb-0">
          {/* Install App Button */}
          {isInstallable && !isInstalled && (
            <Button onClick={promptInstall} variant="secondary" visualSize="lg" className="w-full">
              <Smartphone className="text-success-text h-5 w-5" />
              <span>Install App</span>
            </Button>
          )}

          <Button onClick={handleImport} variant="secondary" visualSize="lg" className="w-full">
            <Upload className="h-5 w-5" />
            <span>Import Bookmarks</span>
          </Button>

          <Button onClick={handleExport} variant="secondary" visualSize="lg" className="w-full">
            <Download className="h-5 w-5" />
            <span>Export Bookmarks</span>
          </Button>

          <Button
            onClick={() => navigate('/recycle-bin')}
            variant="secondary"
            visualSize="lg"
            className="w-full"
          >
            <Trash className="h-5 w-5" />
            <span>Recycle Bin</span>
          </Button>

          <Button onClick={handleSignOut} variant="secondary" visualSize="lg" className="w-full">
            <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400">Sign Out</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="p-4 pb-0">
          <div className="border-border bg-card rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{bookmarks.length}</div>
                <div className="text-secondary-foreground text-sm">Bookmarks</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{collections.length}</div>
                <div className="text-secondary-foreground text-sm">Collections</div>
              </div>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="mt-4 p-4">
          <div className="text-secondary-foreground text-center text-sm">
            <p>Bookmark Manager PWA</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Edit Name Bottom Sheet */}
      <BottomSheet isOpen={editNameSheet.isOpen} onClose={editNameSheet.close} title="Edit Name">
        <div className="space-y-4 p-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              visualSize="lg"
              value={editNameValue}
              onChange={e => setEditNameValue(e.target.value)}
              placeholder="Enter your name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button visualSize="lg" variant="secondary" onClick={editNameSheet.close}>
              <X className="h-5 w-5" />
              Cancel
            </Button>
            <Button
              visualSize="lg"
              variant="default"
              onClick={handleSaveName}
              disabled={saving || !editNameValue.trim()}
            >
              {saving ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
