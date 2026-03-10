import { UrlMetadata } from './types'

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function normalizeUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(normalizeUrl(url)).hostname
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
  } catch {
    return ''
  }
}

function resolveImageUrl(raw: string, baseUrl: string): string {
  if (!raw) return ''
  // Protocol-relative
  if (raw.startsWith('//')) return `https:${raw}`
  // Already absolute
  if (/^https?:\/\//i.test(raw)) return raw
  // Relative path — resolve against base URL
  try {
    return new URL(raw, baseUrl).href
  } catch {
    return ''
  }
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const normalized = normalizeUrl(url)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(normalized, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PixelBookmarks/1.0)' },
    })
    clearTimeout(timeout)
    const html = await response.text()

    const getMetaContent = (property: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
      return match ? match[1].trim() : ''
    }

    const getMetaName = (name: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
      return match ? match[1].trim() : ''
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const htmlTitle = titleMatch ? titleMatch[1].trim() : ''

    const title = getMetaContent('og:title') || getMetaName('twitter:title') || htmlTitle || extractDomain(url)
    const description =
      getMetaContent('og:description') || getMetaName('description') || getMetaName('twitter:description') || ''
    const rawImageUrl = getMetaContent('og:image') || getMetaName('twitter:image') || ''
    const imageUrl = resolveImageUrl(rawImageUrl, normalized)
    const faviconUrl = getFaviconUrl(url)

    return { title, description, imageUrl, faviconUrl }
  } catch {
    return {
      title: extractDomain(url),
      description: '',
      imageUrl: undefined,
      faviconUrl: getFaviconUrl(url),
    }
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export function searchFilter(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  return fields.some((f) => f?.toLowerCase().includes(q))
}
