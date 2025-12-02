import * as db from './db';
import { fetchMetadata } from './metadata';
import type { Bookmark } from '@/types';

class ThumbnailService {
  private isRunning = false;
  private thumbnailUpdateCallbacks: ((bookmark: Bookmark) => void)[] = [];

  /**
   * Subscribe to thumbnail updates
   */
  onThumbnailUpdate(callback: (bookmark: Bookmark) => void): () => void {
    this.thumbnailUpdateCallbacks.push(callback);
    return () => {
      this.thumbnailUpdateCallbacks = this.thumbnailUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers that a bookmark's thumbnail was updated
   */
  private notifyThumbnailUpdate(bookmark: Bookmark) {
    this.thumbnailUpdateCallbacks.forEach(callback => {
      try {
        callback(bookmark);
      } catch (error) {
        console.error('Error in thumbnail update callback:', error);
      }
    });
  }

  /**
   * Fetch thumbnails for all bookmarks that don't have them
   * Runs in background without blocking UI
   */
  async fetchMissingThumbnails(_userId: string): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Get all bookmarks
      const bookmarks = await db.getAllBookmarks();

      // Filter bookmarks without thumbnails OR favicons
      const bookmarksNeedingThumbnails = bookmarks.filter(
        (bookmark: Bookmark) => !bookmark.thumbnail || !bookmark.favicon
      );

      // Process bookmarks in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < bookmarksNeedingThumbnails.length; i += batchSize) {
        const batch = bookmarksNeedingThumbnails.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map((bookmark: Bookmark) => this.fetchAndUpdateThumbnail(bookmark))
        );

        // Small delay between batches to be respectful to the API
        if (i + batchSize < bookmarksNeedingThumbnails.length) {
          await this.delay(1000);
        }
      }
    } catch (error) {
      console.error('Error during thumbnail fetch:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fetch and update thumbnail for a single bookmark
   */
  private async fetchAndUpdateThumbnail(bookmark: Bookmark): Promise<void> {
    try {
      const metadata = await fetchMetadata(bookmark.url);

      // Only update if we got new thumbnail or favicon data
      if (metadata.thumbnail || metadata.favicon) {
        const updatedBookmark: Bookmark = {
          ...bookmark,
          thumbnail: metadata.thumbnail || bookmark.thumbnail,
          favicon: metadata.favicon || bookmark.favicon,
          lastModifiedAt: Date.now(),
        };

        await db.updateBookmark(updatedBookmark);

        // Notify subscribers about the update
        this.notifyThumbnailUpdate(updatedBookmark);
      }
    } catch (error) {
      console.error(`Failed to fetch thumbnail for ${bookmark.title}:`, error);
    }
  }

  /**
   * Fetch thumbnail for a specific bookmark URL
   */
  async fetchThumbnailForUrl(url: string): Promise<{
    thumbnail?: string;
    favicon?: string;
  }> {
    try {
      const metadata = await fetchMetadata(url);
      return {
        thumbnail: metadata.thumbnail,
        favicon: metadata.favicon,
      };
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      return {};
    }
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get default thumbnail SVG data URL for a given platform
   */
  getDefaultThumbnail(platform?: string): string {
    // Simple colored rectangles with platform icon/letter
    const colors: Record<string, string> = {
      youtube: '#FF0000',
      twitter: '#1DA1F2',
      github: '#181717',
      medium: '#000000',
      reddit: '#FF4500',
      linkedin: '#0A66C2',
      other: '#6B7280',
    };

    const color = colors[platform || 'other'] || colors.other;

    // Return a simple SVG as data URL
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.3">
          ${(platform || 'WEB').toUpperCase().slice(0, 3)}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get default favicon SVG data URL
   */
  getDefaultFavicon(url: string): string {
    try {
      const domain = new URL(url).hostname;
      const letter = domain.charAt(0).toUpperCase();

      const svg = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#6B7280" rx="4"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${letter}
          </text>
        </svg>
      `.trim();

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch {
      const svg = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#6B7280" rx="4"/>
          <circle cx="16" cy="16" r="8" fill="white"/>
        </svg>
      `.trim();

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  }
}

export const thumbnailService = new ThumbnailService();
