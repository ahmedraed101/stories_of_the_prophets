import type { MediaItem, Playlist } from '../types/content'

export function extractYoutubePlaylistId(input: string): string | null {
  try {
    const trimmed = input.trim()
    if (/^PL[\w-]+$/.test(trimmed)) return trimmed
    const url = new URL(trimmed)
    const list = url.searchParams.get('list')
    if (list) return list
  } catch {
    // Not a URL — ignore.
  }
  return null
}

function firstByLocalName(root: Element | Document, localName: string): Element | null {
  const all = root.getElementsByTagName('*')
  for (const el of Array.from(all)) {
    if (el.localName === localName) return el
  }
  return null
}

function parseAtomFeed(xml: string, playlistId: string): Playlist {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid playlist feed')
  }

  const text = (el: Element | null) => el?.textContent?.trim() ?? ''
  const feedTitle =
    text(doc.querySelector('feed > title')) || `Playlist ${playlistId}`

  const items: MediaItem[] = []
  for (const entry of Array.from(doc.querySelectorAll('feed > entry'))) {
    const videoId = text(firstByLocalName(entry, 'videoId'))
    if (!videoId) continue
    const title = text(entry.querySelector('title')) || videoId

    items.push({
      id: videoId,
      title,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    })
  }

  if (items.length === 0) {
    throw new Error('No videos found in this playlist')
  }

  return {
    id: `yt-${playlistId}`,
    title: feedTitle,
    sourceUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    builtIn: false,
    sections: [
      {
        id: 'all',
        title: feedTitle,
        items,
      },
    ],
  }
}

async function fetchFeedXml(playlistId: string): Promise<string> {
  const rss = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`

  // Dev proxy (vite.config) avoids CORS on localhost.
  const candidates = [
    `/api/youtube-feed?playlist_id=${encodeURIComponent(playlistId)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rss)}`,
  ]

  let lastError: unknown
  for (const url of candidates) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.includes('<feed') && !text.includes('<entry')) {
        throw new Error('Unexpected response')
      }
      return text
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Could not fetch playlist')
}

export async function importYoutubePlaylist(
  input: string,
  customTitle?: string,
): Promise<Playlist> {
  const playlistId = extractYoutubePlaylistId(input)
  if (!playlistId) {
    throw new Error('Invalid YouTube playlist link')
  }
  const xml = await fetchFeedXml(playlistId)
  const playlist = parseAtomFeed(xml, playlistId)
  if (customTitle?.trim()) {
    playlist.title = customTitle.trim()
    if (playlist.sections[0]) playlist.sections[0].title = customTitle.trim()
  }
  return playlist
}
