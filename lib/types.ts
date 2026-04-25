export interface Bookmark {
  id: string
  url: string
  title: string
  subtitle: string
  imageUri?: string
  faviconUri?: string
  collectionId?: string
  createdAt: number
  updatedAt: number
}

export interface Collection {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
}

export interface AppSettings {
  themePreference: 'light' | 'dark' | 'system'
}

export interface UrlMetadata {
  title: string
  description: string
  imageUrl?: string
  faviconUrl?: string
}
