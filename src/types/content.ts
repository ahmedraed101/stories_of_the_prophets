export type MediaSource = 'youtube' | 'vimeo' | 'embed'

export type MediaItem = {
  id: string
  title: string
  description?: string
  source: MediaSource
  /** Full watch URL, or a direct embed URL when source is "embed" */
  url: string
  /** Optional explicit thumbnail; YouTube/Vimeo can also be derived from url */
  thumbnail?: string
  durationHint?: string
}

export type CollectionSection = {
  id: string
  title: string
  description?: string
  items: MediaItem[]
}

export type Playlist = {
  id: string
  title: string
  subtitle?: string
  description?: string
  /** Original YouTube (or other) playlist URL when imported */
  sourceUrl?: string
  /** True for bundled seed playlists */
  builtIn?: boolean
  sections: CollectionSection[]
}

/** @deprecated Use Playlist — kept as alias for progress helpers */
export type Collection = Playlist

export type ItemProgress = {
  completed: boolean
  lastOpenedAt?: string
}

export type ProgressState = {
  collectionId: string
  items: Record<string, ItemProgress>
}

export type LibraryState = {
  playlists: Playlist[]
}
