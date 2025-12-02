export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
  collectionId?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  lastModifiedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  order: number;
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  lastModifiedAt: number;
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  bookmarks: Bookmark[];
  errors: string[];
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync?: number;
  error?: string;
}

export interface SearchFilters {
  query?: string;
  collectionId?: string;
  dateFrom?: number;
  dateTo?: number;
}

export interface MetadataResult {
  title: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
}

export type ViewMode = 'card' | 'list' | 'grid';

export type SortBy = 'createdAt' | 'lastModifiedAt' | 'title' | 'url';
export type SortOrder = 'asc' | 'desc';
