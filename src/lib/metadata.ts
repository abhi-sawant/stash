import type { MetadataResult } from '@/types';

export async function fetchMetadata(url: string): Promise<MetadataResult> {
  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        title: data.data.title || new URL(url).hostname,
        description: data.data.description,
        favicon: data.data.logo?.url,
        thumbnail: data.data.image?.url || data.data.screenshot?.url,
      };
    }

    // Fallback to basic metadata
    return {
      title: new URL(url).hostname,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      title: new URL(url).hostname,
    };
  }
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
