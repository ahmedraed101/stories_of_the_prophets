export type AppScreen =
  | { name: 'home' }
  | { name: 'achievements' }
  | { name: 'series'; seriesId: string }
  | {
      name: 'player'
      seriesId: string
      playlistId: string
      itemId: string
    }

const HISTORY_FLAG = 'stories-prophets:nav'

function screensEqual(a: AppScreen, b: AppScreen): boolean {
  if (a.name !== b.name) return false
  switch (a.name) {
    case 'home':
    case 'achievements':
      return true
    case 'series':
      return b.name === 'series' && a.seriesId === b.seriesId
    case 'player':
      return (
        b.name === 'player' &&
        a.seriesId === b.seriesId &&
        a.playlistId === b.playlistId &&
        a.itemId === b.itemId
      )
  }
}

/** Build pathname for a screen. Search params (e.g. ?platform=tv) stay as-is. */
export function pathForScreen(screen: AppScreen): string {
  switch (screen.name) {
    case 'home':
      return '/'
    case 'achievements':
      return '/achievements'
    case 'series':
      return `/series/${encodeURIComponent(screen.seriesId)}`
    case 'player':
      return `/series/${encodeURIComponent(screen.seriesId)}/watch/${encodeURIComponent(screen.playlistId)}/${encodeURIComponent(screen.itemId)}`
  }
}

export function screenFromLocation(
  pathname = window.location.pathname,
): AppScreen {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home' }

  if (parts[0] === 'achievements') return { name: 'achievements' }

  if (parts[0] === 'series' && parts[1]) {
    const seriesId = decodeURIComponent(parts[1])
    if (parts[2] === 'watch' && parts[3] && parts[4]) {
      return {
        name: 'player',
        seriesId,
        playlistId: decodeURIComponent(parts[3]),
        itemId: decodeURIComponent(parts[4]),
      }
    }
    return { name: 'series', seriesId }
  }

  return { name: 'home' }
}

function locationForScreen(screen: AppScreen): string {
  return pathForScreen(screen) + window.location.search
}

export function initAppNavigation(screen: AppScreen): void {
  const path = locationForScreen(screen)
  const current = window.location.pathname + window.location.search
  history.replaceState({ [HISTORY_FLAG]: true, screen }, '', path || current)
}

export function pushAppScreen(screen: AppScreen): void {
  const current = history.state?.screen as AppScreen | undefined
  if (current && screensEqual(current, screen)) return
  history.pushState(
    { [HISTORY_FLAG]: true, screen },
    '',
    locationForScreen(screen),
  )
}

export function replaceAppScreen(screen: AppScreen): void {
  history.replaceState(
    { [HISTORY_FLAG]: true, screen },
    '',
    locationForScreen(screen),
  )
}

export function subscribeAppBackNavigation(
  onScreen: (screen: AppScreen) => void,
): () => void {
  const onPopState = (event: PopStateEvent) => {
    const fromState = event.state?.screen as AppScreen | undefined
    onScreen(fromState ?? screenFromLocation())
  }
  window.addEventListener('popstate', onPopState)
  return () => window.removeEventListener('popstate', onPopState)
}
