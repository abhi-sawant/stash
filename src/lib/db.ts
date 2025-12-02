import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Bookmark, Collection } from '@/types';

interface BookmarkDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      'by-collection': string;
      'by-created': number;
    };
  };
  collections: {
    key: string;
    value: Collection;
    indexes: {
      'by-parent': string;
      'by-order': number;
    };
  };
}

let dbInstance: IDBPDatabase<BookmarkDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<BookmarkDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BookmarkDB>('bookmark-pwa-db', 1, {
    upgrade(db) {
      // Bookmarks store
      const bookmarkStore = db.createObjectStore('bookmarks', {
        keyPath: 'id',
      });
      bookmarkStore.createIndex('by-collection', 'collectionId');
      bookmarkStore.createIndex('by-created', 'createdAt');

      // Collections store
      const collectionStore = db.createObjectStore('collections', {
        keyPath: 'id',
      });
      collectionStore.createIndex('by-parent', 'parentId');
      collectionStore.createIndex('by-order', 'order');
    },
  });

  return dbInstance;
}

export async function getDB() {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// Bookmark operations
export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  const bookmarks = await db.getAll('bookmarks');
  // Filter out soft-deleted bookmarks
  return bookmarks.filter(b => !b.isDeleted);
}

export async function getDeletedBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  const bookmarks = await db.getAll('bookmarks');
  // Return only soft-deleted bookmarks
  return bookmarks.filter(b => b.isDeleted === true);
}

export async function getBookmarkById(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', id);
}

export async function addBookmark(bookmark: Bookmark): Promise<string> {
  const db = await getDB();
  await db.add('bookmarks', bookmark);
  return bookmark.id;
}

export async function updateBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put('bookmarks', bookmark);
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  // Soft delete - mark as deleted instead of removing
  const bookmark = await db.get('bookmarks', id);
  if (bookmark) {
    await db.put('bookmarks', {
      ...bookmark,
      isDeleted: true,
      deletedAt: Date.now(),
      lastModifiedAt: Date.now(),
    });
  }
}

export async function permanentlyDeleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

export async function restoreBookmark(id: string): Promise<void> {
  const db = await getDB();
  const bookmark = await db.get('bookmarks', id);
  if (bookmark && bookmark.isDeleted) {
    await db.put('bookmarks', {
      ...bookmark,
      isDeleted: false,
      deletedAt: undefined,
      lastModifiedAt: Date.now(),
    });
  }
}

export async function getBookmarksByCollection(collectionId: string): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-collection', collectionId);
}

// Collection operations
export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDB();
  const collections = await db.getAll('collections');
  // Filter out soft-deleted collections
  return collections.filter(c => !c.isDeleted);
}

export async function getDeletedCollections(): Promise<Collection[]> {
  const db = await getDB();
  const collections = await db.getAll('collections');
  // Return only soft-deleted collections
  return collections.filter(c => c.isDeleted === true);
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  const db = await getDB();
  return db.get('collections', id);
}

export async function addCollection(collection: Collection): Promise<string> {
  const db = await getDB();
  await db.add('collections', collection);
  return collection.id;
}

export async function updateCollection(collection: Collection): Promise<void> {
  const db = await getDB();
  await db.put('collections', collection);
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB();
  // Soft delete - mark as deleted instead of removing
  const collection = await db.get('collections', id);
  if (collection) {
    await db.put('collections', {
      ...collection,
      isDeleted: true,
      deletedAt: Date.now(),
      lastModifiedAt: Date.now(),
    });

    // Also soft delete all bookmarks in this collection
    const bookmarks = await getBookmarksByCollection(id);
    for (const bookmark of bookmarks) {
      await db.put('bookmarks', {
        ...bookmark,
        isDeleted: true,
        deletedAt: Date.now(),
        lastModifiedAt: Date.now(),
      });
    }
  }
}

export async function permanentlyDeleteCollection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('collections', id);
}

export async function restoreCollection(id: string): Promise<void> {
  const db = await getDB();
  const collection = await db.get('collections', id);
  if (collection && collection.isDeleted) {
    await db.put('collections', {
      ...collection,
      isDeleted: false,
      deletedAt: undefined,
      lastModifiedAt: Date.now(),
    });
  }
}

// Batch operations
export async function batchDeleteBookmarks(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  await Promise.all([...ids.map(id => tx.store.delete(id)), tx.done]);
}

export async function batchUpdateBookmarks(bookmarks: Bookmark[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  await Promise.all([...bookmarks.map(bookmark => tx.store.put(bookmark)), tx.done]);
}

// Clear all data (for user sign out)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['bookmarks', 'collections'], 'readwrite');
  await Promise.all([
    tx.objectStore('bookmarks').clear(),
    tx.objectStore('collections').clear(),
    tx.done,
  ]);
}

// Recycle bin operations
export async function cleanupOldDeletedItems(): Promise<void> {
  const db = await getDB();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Get all items from both stores
  const [bookmarks, collections] = await Promise.all([
    db.getAll('bookmarks'),
    db.getAll('collections'),
  ]);

  // Delete bookmarks older than 7 days
  const oldBookmarks = bookmarks.filter(
    b => b.isDeleted && b.deletedAt && b.deletedAt < sevenDaysAgo
  );

  // Delete collections older than 7 days
  const oldCollections = collections.filter(
    c => c.isDeleted && c.deletedAt && c.deletedAt < sevenDaysAgo
  );

  // Perform deletions
  const tx = db.transaction(['bookmarks', 'collections'], 'readwrite');
  await Promise.all([
    ...oldBookmarks.map(b => tx.objectStore('bookmarks').delete(b.id)),
    ...oldCollections.map(c => tx.objectStore('collections').delete(c.id)),
    tx.done,
  ]);
}

export async function emptyRecycleBin(): Promise<void> {
  const db = await getDB();

  // Get all deleted items
  const [bookmarks, collections] = await Promise.all([
    db.getAll('bookmarks'),
    db.getAll('collections'),
  ]);

  const deletedBookmarks = bookmarks.filter(b => b.isDeleted);
  const deletedCollections = collections.filter(c => c.isDeleted);

  // Perform deletions
  const tx = db.transaction(['bookmarks', 'collections'], 'readwrite');
  await Promise.all([
    ...deletedBookmarks.map(b => tx.objectStore('bookmarks').delete(b.id)),
    ...deletedCollections.map(c => tx.objectStore('collections').delete(c.id)),
    tx.done,
  ]);
}
