import type { MediaItem, MediaSource } from '../types/content'

export function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]
    }
  } catch {
    return null
  }
  return null
}

function vimeoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('vimeo.com')) return null
    const parts = u.pathname.split('/').filter(Boolean)
    const id = parts.find((p) => /^\d+$/.test(p))
    return id ?? null
  } catch {
    return null
  }
}

export function getWatchUrl(item: MediaItem): string {
  if (item.source === 'youtube') {
    const id = youtubeIdFromUrl(item.url)
    if (id) return `https://www.youtube.com/watch?v=${id}`
  }
  return item.url
}

export function getEmbedSrc(item: MediaItem): string | null {
  switch (item.source as MediaSource) {
    case 'youtube': {
      const id = youtubeIdFromUrl(item.url)
      if (!id) return null
      // Use standard youtube.com embed (nocookie often triggers bot checks).
      const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        playsinline: '1',
      })
      if (typeof window !== 'undefined') {
        params.set('origin', window.location.origin)
      }
      return `https://www.youtube.com/embed/${id}?${params.toString()}`
    }
    case 'vimeo': {
      const id = vimeoIdFromUrl(item.url)
      if (!id) return null
      return `https://player.vimeo.com/video/${id}`
    }
    case 'embed':
      return item.url
    default:
      return null
  }
}

/** YouTube hqdefault/sddefault are 4:3 with letterboxing; mqdefault is true 16:9. */
export function youtubeThumbnail(
  videoId: string,
  size: 'mqdefault' | 'maxresdefault' = 'mqdefault',
): string {
  return `https://i.ytimg.com/vi/${videoId}/${size}.jpg`
}

function normalizeYoutubeThumbnailUrl(url: string): string {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('ytimg.com')) return url
    const match = u.pathname.match(/\/vi\/([^/]+)\//)
    if (!match) return url
    if (/\/(hqdefault|sddefault|default|1|2|3)\.jpg$/i.test(u.pathname)) {
      return youtubeThumbnail(match[1], 'mqdefault')
    }
    return url
  } catch {
    return url
  }
}

/** Prefer explicit thumbnail; otherwise derive from known platforms. */
export function getThumbnailUrl(item: MediaItem): string | null {
  if (item.thumbnail) return normalizeYoutubeThumbnailUrl(item.thumbnail)
  if (item.source === 'youtube') {
    const id = youtubeIdFromUrl(item.url)
    if (id) return youtubeThumbnail(id, 'mqdefault')
  }
  return null
}

export function sourceLabel(source: MediaSource): string {
  switch (source) {
    case 'youtube':
      return 'YouTube'
    case 'vimeo':
      return 'Vimeo'
    case 'embed':
      return 'Embed'
  }
}
