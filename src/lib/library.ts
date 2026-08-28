import type { LibraryState, Playlist } from '../types/content'
import { getThumbnailUrl } from './embeds'
import season1 from '../content/season-1.json'
import season2 from '../content/season-2.json'
import sirah from '../content/sirah.json'

const LIBRARY_KEY = 'stories-prophets:library:v2'

function normalizeTitle(title: string): string {
  return title.replace(/االأول/g, 'الأول').trim()
}

function seedPlaylists(): Playlist[] {
  const s1 = season1 as Playlist
  const s2 = season2 as Playlist
  const s3 = sirah as Playlist
  return [
    {
      ...s1,
      title: normalizeTitle(s1.title || 'قصص الأنبياء (الموسم الأول)'),
      builtIn: true,
      sourceUrl:
        s1.sourceUrl ??
        'https://www.youtube.com/playlist?list=PLf_PY1EEFtdmykuAZ_99TLqVBP7FFmrIS',
    },
    {
      ...s2,
      title: normalizeTitle(s2.title || 'قصص الأنبياء (الموسم الثاني)'),
      builtIn: true,
      sourceUrl:
        s2.sourceUrl ??
        'https://www.youtube.com/playlist?list=PLbDRORmj0gyevDGklUqlVqkxhulsF6IDq',
    },
    {
      ...s3,
      title: normalizeTitle(s3.title || 'السيرة النبوية'),
      builtIn: true,
      sourceUrl:
        s3.sourceUrl ??
        'https://www.youtube.com/playlist?list=PLbDRORmj0gydAp_9O0Vc4fq4qE3zmrTdw',
    },
  ]
}

function normalizePlaylists(playlists: Playlist[]): Playlist[] {
  const seeds = seedPlaylists()
  return playlists.map((playlist) => {
    const seed = seeds.find((s) => s.id === playlist.id)
    if (!seed) return { ...playlist, title: normalizeTitle(playlist.title) }
    if (
      playlist.title === 'Focus Media' ||
      !playlist.title.trim() ||
      playlist.title.includes('االأول')
    ) {
      return {
        ...playlist,
        title: seed.title,
        subtitle: seed.subtitle ?? playlist.subtitle,
        description: seed.description ?? playlist.description,
      }
    }
    return { ...playlist, title: normalizeTitle(playlist.title) }
  })
}

function syncBuiltInPlaylistItems(playlists: Playlist[]): Playlist[] {
  const seeds = seedPlaylists()
  return playlists.map((playlist) => {
    const seed = seeds.find((s) => s.id === playlist.id)
    if (!seed?.builtIn) return playlist
    return {
      ...playlist,
      title: seed.title,
      subtitle: seed.subtitle,
      description: seed.description,
      sourceUrl: seed.sourceUrl,
      sections: seed.sections,
    }
  })
}

function ensureBuiltInPlaylists(playlists: Playlist[]): Playlist[] {
  const seeds = seedPlaylists()
  const merged = [...playlists]
  for (const seed of seeds) {
    if (!merged.some((p) => p.id === seed.id)) {
      merged.push(seed)
    }
  }
  const order = seeds.map((s) => s.id)
  merged.sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  return merged
}

export function loadLibrary(): LibraryState {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (!raw) return { playlists: seedPlaylists() }
    const parsed = JSON.parse(raw) as LibraryState
    if (!Array.isArray(parsed.playlists) || parsed.playlists.length === 0) {
      return { playlists: seedPlaylists() }
    }
    const playlists = syncBuiltInPlaylistItems(
      ensureBuiltInPlaylists(normalizePlaylists(parsed.playlists)),
    )
    const next = { playlists }
    if (JSON.stringify(parsed.playlists) !== JSON.stringify(playlists)) {
      saveLibrary(next)
    }
    return next
  } catch {
    return { playlists: seedPlaylists() }
  }
}

export function saveLibrary(state: LibraryState): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(state))
  } catch {
    // Session-only when storage is unavailable.
  }
}

export function addPlaylist(
  state: LibraryState,
  playlist: Playlist,
): LibraryState {
  const next = {
    playlists: [...state.playlists, playlist],
  }
  saveLibrary(next)
  return next
}

export function removePlaylist(
  state: LibraryState,
  playlistId: string,
): LibraryState {
  const target = state.playlists.find((p) => p.id === playlistId)
  if (target?.builtIn) return state
  const next = {
    playlists: state.playlists.filter((p) => p.id !== playlistId),
  }
  saveLibrary(next)
  return next
}

export function playlistCover(playlist: Playlist): string | null {
  for (const section of playlist.sections) {
    for (const item of section.items) {
      const thumb = getThumbnailUrl(item)
      if (thumb) return thumb
    }
  }
  return null
}

export function playlistItemCount(playlist: Playlist): number {
  return playlist.sections.reduce((sum, s) => sum + s.items.length, 0)
}
