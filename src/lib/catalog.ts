import type { LibraryState, Playlist } from '../types/content'

export function playlistById(
  library: LibraryState,
  playlistId: string,
): Playlist | null {
  return library.playlists.find((p) => p.id === playlistId) ?? null
}
