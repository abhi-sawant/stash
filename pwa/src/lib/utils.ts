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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function extractImdbTitleId(url: string): string | null {
  try {
    const parsed = new URL(normalizeUrl(url))
    if (!parsed.hostname.includes('imdb.com')) return null
    const match = parsed.pathname.match(/\/title\/(tt\d+)/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 60) return ''
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${totalMinutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function normalizeAmazonImageUrl(url?: string): string {
  if (!url) return ''
  return url.replace(/\._V1_\.(jpg|jpeg|png)$/i, '._V1_FMjpg_UX1000_.$1')
}

function extractJsonLdMetadata(html: string, normalizedUrl: string): Partial<UrlMetadata> {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]

  for (const match of scripts) {
    const raw = match[1]?.trim()
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        const candidate = Array.isArray(item?.['@graph']) ? item['@graph'][0] : item
        const title = typeof candidate?.headline === 'string' ? candidate.headline : candidate?.name
        const description = typeof candidate?.description === 'string' ? candidate.description : ''
        const image =
          typeof candidate?.image === 'string'
            ? candidate.image
            : typeof candidate?.image?.url === 'string'
              ? candidate.image.url
              : Array.isArray(candidate?.image)
                ? candidate.image.find((entry: unknown) => typeof entry === 'string')
                : ''

        if (title || description || image) {
          return {
            title: typeof title === 'string' ? decodeHtmlEntities(title) : '',
            description: typeof description === 'string' ? decodeHtmlEntities(description) : '',
            imageUrl: resolveImageUrl(typeof image === 'string' ? image : '', normalizedUrl) || undefined,
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }

  return {}
}

async function fetchHtmlWithFallbacks(url: string): Promise<string> {
  const proxyUrls = [
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  ]

  for (const proxyUrl of proxyUrls) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(proxyUrl, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) continue

      const text = await response.text()
      if (!text) continue

      if (proxyUrl.includes('/get?url=')) {
        const json = JSON.parse(text) as { contents?: string }
        if (json.contents) return json.contents
        continue
      }

      return text
    } catch {
      // Try the next fallback
    }
  }

  throw new Error('Unable to fetch page HTML through available proxies')
}

async function fetchImdbMetadata(url: string): Promise<UrlMetadata | null> {
  const titleId = extractImdbTitleId(url)
  if (!titleId) return null

  try {
    const [titleResponse, certificatesResponse] = await Promise.all([
      fetch(`https://api.imdbapi.dev/titles/${titleId}`),
      fetch(`https://api.imdbapi.dev/titles/${titleId}/certificates`),
    ])

    if (!titleResponse.ok) throw new Error(`IMDb title lookup failed: ${titleResponse.status}`)

    const titleData = await titleResponse.json()
    const certificatesData = certificatesResponse.ok ? await certificatesResponse.json() : null

    const genres = Array.isArray(titleData.genres) ? titleData.genres.slice(0, 3).join(', ') : ''
    const rating = titleData.rating?.aggregateRating
    const certificate =
      certificatesData?.certificates?.find((entry: { country?: { code?: string } }) => entry.country?.code === 'US')
        ?.rating ??
      certificatesData?.certificates?.[0]?.rating ??
      ''

    const titleParts = [
      `${titleData.primaryTitle ?? extractDomain(url)}${titleData.startYear ? ` (${titleData.startYear})` : ''}`,
      rating ? `⭐ ${rating}` : '',
      genres,
    ].filter(Boolean)

    const description = [formatDuration(titleData.runtimeSeconds), certificate].filter(Boolean).join(' | ')

    return {
      title: titleParts.join(' | ').replace(' | ⭐', ' ⭐'),
      description: description || titleData.plot || '',
      imageUrl: normalizeAmazonImageUrl(titleData.primaryImage?.url) || undefined,
      faviconUrl: getFaviconUrl(url),
    }
  } catch {
    return null
  }
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const normalized = normalizeUrl(url)
  try {
    const imdbMetadata = await fetchImdbMetadata(normalized)
    if (imdbMetadata) return imdbMetadata

    const html = await fetchHtmlWithFallbacks(normalized)

    const getMetaContent = (property: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
      return match ? decodeHtmlEntities(match[1]) : ''
    }

    const getMetaName = (name: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
      return match ? decodeHtmlEntities(match[1]) : ''
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const htmlTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : ''
    const jsonLd = extractJsonLdMetadata(html, normalized)

    const title =
      getMetaContent('og:title') || getMetaName('twitter:title') || jsonLd.title || htmlTitle || extractDomain(url)
    const description =
      getMetaContent('og:description') ||
      getMetaName('description') ||
      getMetaName('twitter:description') ||
      jsonLd.description ||
      ''
    const rawImageUrl = getMetaContent('og:image') || getMetaName('twitter:image') || jsonLd.imageUrl || ''
    const imageUrl = resolveImageUrl(rawImageUrl, normalized)
    const faviconUrl = getFaviconUrl(url)

    return { title, description, imageUrl, faviconUrl }
  } catch {
    return { title: extractDomain(url), description: '', faviconUrl: getFaviconUrl(url) }
  }
}
