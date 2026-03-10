import type { UrlMetadata } from './types'

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

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function searchFilter(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  return fields.some((f) => f?.toLowerCase().includes(q))
}

function resolveImageUrl(raw: string, baseUrl: string): string {
  if (!raw) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
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
    // Use a CORS proxy for web
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(normalized)}`
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timeout)
    const json = await response.json()
    const html: string = json.contents ?? ''

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
    return { title: extractDomain(url), description: '', faviconUrl: getFaviconUrl(url) }
  }
}
