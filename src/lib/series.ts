import type { LibraryState, MediaItem, Playlist } from '../types/content'
import type { ProgressState } from '../types/content'
import { getThumbnailUrl } from './embeds'
import { flattenItems, getItemProgress, progressStats } from './progress'
import { playlistById } from './catalog'

export type SeriesDef = {
  id: string
  titleAr: string
  titleEn: string
  subtitleAr: string
  subtitleEn: string
  playlistIds: string[]
  builtIn: boolean
}

const BUILTIN_SERIES: SeriesDef[] = [
  {
    id: 'prophets-stories',
    titleAr: 'قصص الأنبياء',
    titleEn: 'Stories of the Prophets',
    subtitleAr: 'الموسم الأول والثاني — الشيخ نبيل العوضي',
    subtitleEn: 'Seasons 1 & 2 — Sheikh Nabil Al-Awadi',
    playlistIds: ['prophets-s1', 'prophets-s2'],
    builtIn: true,
  },
  {
    id: 'prophetic-sirah',
    titleAr: 'السيرة النبوية',
    titleEn: 'The Prophetic Biography',
    subtitleAr: 'برنامج الحبيب — الشيخ نبيل العوضي',
    subtitleEn: 'Al-Habib series — Sheikh Nabil Al-Awadi',
    playlistIds: ['prophetic-sirah'],
    builtIn: true,
  },
]

const BUILTIN_PLAYLIST_IDS = new Set(
  BUILTIN_SERIES.flatMap((series) => series.playlistIds),
)

export type CatalogItem = {
  seriesId: string
  playlistId: string
  item: MediaItem
}

export type SeriesSection = {
  id: string
  title: string
  playlistId: string
  items: MediaItem[]
}

export type SeriesView = {
  def: SeriesDef
  sections: SeriesSection[]
  totalVideos: number
}

function customSeriesFromPlaylist(playlist: Playlist): SeriesDef {
  const subtitle = playlist.subtitle ?? playlist.description ?? ''
  return {
    id: `series:${playlist.id}`,
    titleAr: playlist.title,
    titleEn: playlist.title,
    subtitleAr: subtitle,
    subtitleEn: subtitle,
    playlistIds: [playlist.id],
    builtIn: false,
  }
}

export function allSeriesDefs(library: LibraryState): SeriesDef[] {
  const custom = library.playlists
    .filter((playlist) => !playlist.builtIn && !BUILTIN_PLAYLIST_IDS.has(playlist.id))
    .map(customSeriesFromPlaylist)
  return [...BUILTIN_SERIES, ...custom]
}

export function seriesTitle(
  def: SeriesDef,
  language: 'ar' | 'en',
): string {
  return language === 'ar' ? def.titleAr : def.titleEn
}

export function seriesSubtitle(
  def: SeriesDef,
  language: 'ar' | 'en',
): string {
  return language === 'ar' ? def.subtitleAr : def.subtitleEn
}

export function buildSeriesViews(library: LibraryState): SeriesView[] {
  return allSeriesDefs(library)
    .map((def) => {
      const sections: SeriesSection[] = []
      let totalVideos = 0
      for (const playlistId of def.playlistIds) {
        const playlist = playlistById(library, playlistId)
        if (!playlist) continue
        const items = flattenItems(playlist).map(({ item }) => item)
        totalVideos += items.length
        sections.push({
          id: playlist.id,
          title: playlist.title,
          playlistId: playlist.id,
          items,
        })
      }
      return { def, sections, totalVideos }
    })
    .filter((view) => view.totalVideos > 0)
}

export function seriesFlat(
  library: LibraryState,
  seriesId: string,
): CatalogItem[] {
  const def = allSeriesDefs(library).find((s) => s.id === seriesId)
  if (!def) return []
  const items: CatalogItem[] = []
  for (const playlistId of def.playlistIds) {
    const playlist = playlistById(library, playlistId)
    if (!playlist) continue
    for (const { item } of flattenItems(playlist)) {
      items.push({ seriesId, playlistId, item })
    }
  }
  return items
}

export function seriesProgressStats(
  library: LibraryState,
  seriesId: string,
  getProgress: (playlistId: string) => ProgressState,
) {
  const def = allSeriesDefs(library).find((s) => s.id === seriesId)
  if (!def) return { total: 0, completed: 0, percent: 0 }
  let total = 0
  let completed = 0
  for (const playlistId of def.playlistIds) {
    const playlist = playlistById(library, playlistId)
    if (!playlist) continue
    const stats = progressStats(playlist, getProgress(playlistId))
    total += stats.total
    completed += stats.completed
  }
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent }
}

export function allSeriesProgressStats(
  library: LibraryState,
  getProgress: (playlistId: string) => ProgressState,
) {
  let total = 0
  let completed = 0
  for (const def of allSeriesDefs(library)) {
    const stats = seriesProgressStats(library, def.id, getProgress)
    total += stats.total
    completed += stats.completed
  }
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent }
}

export function findSeriesNeighbors(
  library: LibraryState,
  seriesId: string,
  playlistId: string,
  itemId: string,
) {
  const flat = seriesFlat(library, seriesId)
  const index = flat.findIndex(
    (entry) => entry.playlistId === playlistId && entry.item.id === itemId,
  )
  if (index < 0) {
    return { prev: null, next: null, index: -1, total: flat.length }
  }
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
    index,
    total: flat.length,
  }
}

export function findContinueTarget(
  library: LibraryState,
  getProgress: (playlistId: string) => ProgressState,
): CatalogItem | null {
  for (const def of allSeriesDefs(library)) {
    for (const playlistId of def.playlistIds) {
      const playlist = playlistById(library, playlistId)
      if (!playlist) continue
      const progress = getProgress(playlistId)
      const items = flattenItems(playlist).map(({ item }) => item)
      const resumed = items.find(
        (item) =>
          getItemProgress(progress, item.id).lastOpenedAt &&
          !getItemProgress(progress, item.id).completed,
      )
      if (resumed) {
        return {
          seriesId: def.id,
          playlistId,
          item: resumed,
        }
      }
    }
  }

  for (const def of allSeriesDefs(library)) {
    for (const playlistId of def.playlistIds) {
      const playlist = playlistById(library, playlistId)
      if (!playlist) continue
      const progress = getProgress(playlistId)
      const items = flattenItems(playlist).map(({ item }) => item)
      const next = items.find(
        (item) => !getItemProgress(progress, item.id).completed,
      )
      if (next) {
        return { seriesId: def.id, playlistId, item: next }
      }
    }
  }

  return seriesFlat(library, 'prophets-stories')[0] ?? null
}

export function seriesCover(
  library: LibraryState,
  seriesId: string,
): string | null {
  const flat = seriesFlat(library, seriesId)
  for (const { item } of flat) {
    const thumb = getThumbnailUrl(item)
    if (thumb) return thumb
  }
  return null
}

export function seriesDefById(
  library: LibraryState,
  id: string,
): SeriesDef | null {
  return allSeriesDefs(library).find((s) => s.id === id) ?? null
}

export function seriesIcon(seriesId: string): string {
  if (seriesId === 'prophets-stories') return '☪'
  if (seriesId === 'prophetic-sirah') return '🕌'
  return '📖'
}

export function nextSeriesId(seriesId: string): string | null {
  if (seriesId === 'prophets-stories') return 'prophetic-sirah'
  return null
}

export const GRAND_ACHIEVEMENT_ID = '__grand__'

export function completedSeriesList(
  library: LibraryState,
  getProgress: (playlistId: string) => ProgressState,
): SeriesDef[] {
  return allSeriesDefs(library).filter((def) => {
    const stats = seriesProgressStats(library, def.id, getProgress)
    return stats.total > 0 && stats.percent === 100
  })
}

export function allBuiltinSeriesComplete(
  library: LibraryState,
  getProgress: (playlistId: string) => ProgressState,
): boolean {
  return BUILTIN_SERIES.every((def) => {
    const stats = seriesProgressStats(library, def.id, getProgress)
    return stats.total > 0 && stats.percent === 100
  })
}

export function achievementIcon(targetId: string): string {
  if (targetId === GRAND_ACHIEVEMENT_ID) return '🏆'
  return seriesIcon(targetId)
}
