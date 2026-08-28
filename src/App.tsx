import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { LibraryState, MediaItem, Playlist, ProgressState } from './types/content'
import { playlistById } from './lib/catalog'
import {
  allSeriesProgressStats,
  buildSeriesViews,
  findContinueTarget,
  findSeriesNeighbors,
  seriesCover,
  seriesDefById,
  seriesIcon,
  nextSeriesId,
  seriesProgressStats,
  seriesSubtitle,
  seriesTitle,
  type CatalogItem,
} from './lib/series'
import {
  clearProgress,
  getItemProgress,
  loadProgress,
  markOpened,
  setCompleted,
} from './lib/progress'
import {
  addPlaylist,
  loadLibrary,
  playlistItemCount,
  removePlaylist,
} from './lib/library'
import {
  getEmbedSrc,
  getThumbnailUrl,
  getWatchUrl,
  sourceLabel,
} from './lib/embeds'
import { importYoutubePlaylist } from './lib/youtubePlaylist'
import { shareContent } from './lib/share'
import {
  canNativeInstall,
  captureInstallPrompt,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isStandaloneApp,
  runInstallPrompt,
} from './lib/pwaInstall'
import { translations, type Language, type Text } from './lib/i18n'
import './App.css'

type Theme = 'light' | 'dark'
type Screen =
  | { name: 'home' }
  | { name: 'series'; seriesId: string }
  | { name: 'player'; seriesId: string; playlistId: string; itemId: string }

const STORAGE_THEME = 'stories-prophets:theme'
const STORAGE_LANGUAGE = 'stories-prophets:language'

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function storedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_THEME)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function storedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_LANGUAGE) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function App() {
  const [library, setLibrary] = useState<LibraryState>(() => loadLibrary())
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [progressMap, setProgressMap] = useState<Record<string, ProgressState>>(
    {},
  )
  const [theme, setTheme] = useState<Theme>(
    () =>
      storedTheme() ??
      (document.documentElement.dataset.theme as Theme | undefined) ??
      systemTheme(),
  )
  const [language, setLanguage] = useState<Language>(storedLanguage)
  const [installReady, setInstallReady] = useState(
    () => canNativeInstall() && !isStandaloneApp(),
  )
  const [installHint, setInstallHint] = useState<string | null>(null)
  const [certificateSeriesId, setCertificateSeriesId] = useState<string | null>(
    null,
  )
  const [shareNotice, setShareNotice] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneApp())
  const text = translations[language]

  const activePlaylist = useMemo(() => {
    if (screen.name !== 'player') return null
    return playlistById(library, screen.playlistId)
  }, [library, screen])

  const activeProgress = useMemo(() => {
    if (!activePlaylist) return null
    return progressMap[activePlaylist.id] ?? loadProgress(activePlaylist.id)
  }, [activePlaylist, progressMap])

  const activeItem = useMemo(() => {
    if (screen.name !== 'player' || !activePlaylist) return null
    for (const section of activePlaylist.sections) {
      const found = section.items.find((i) => i.id === screen.itemId)
      if (found) return found
    }
    return null
  }, [activePlaylist, screen])

  useEffect(() => {
    if (screen.name !== 'player' || !activePlaylist) return
    setProgressMap((prev) => {
      const current = prev[activePlaylist.id] ?? loadProgress(activePlaylist.id)
      const next = markOpened(current, screen.itemId)
      return { ...prev, [activePlaylist.id]: next }
    })
  }, [screen, activePlaylist])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0a1210' : '#f4efe4')
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(STORAGE_LANGUAGE, language)
    } catch {
      // Session-only when storage is unavailable.
    }
  }, [language])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = (event: MediaQueryListEvent) => {
      if (!storedTheme()) setTheme(event.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  useEffect(() => {
    if (getDeferredInstallPrompt()) setInstallReady(true)

    const onBeforeInstall = (event: Event) => {
      captureInstallPrompt(event)
      setInstallReady(true)
    }
    const onInstalled = () => {
      clearDeferredInstallPrompt()
      setInstallReady(false)
      setIsInstalled(true)
      setInstallHint(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function ensureProgress(playlistId: string): ProgressState {
    return progressMap[playlistId] ?? loadProgress(playlistId)
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_THEME, next)
      } catch {
        // Theme still works for this session when storage is unavailable.
      }
      return next
    })
  }

  function toggleLanguage() {
    setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))
  }

  async function handleInstall() {
    if (installReady && canNativeInstall()) {
      const outcome = await runInstallPrompt()
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setInstallReady(false)
        setInstallHint(null)
        return
      }
      if (outcome === 'dismissed') {
        setInstallReady(false)
        return
      }
    }

    const ua = navigator.userAgent
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /Android/i.test(ua)
    setInstallHint(
      isIos
        ? text.installHintIos
        : isAndroid
          ? text.installHintAndroid
          : text.installHintGeneric,
    )
  }

  function openItem(seriesId: string, playlistId: string, item: MediaItem) {
    setScreen({ name: 'player', seriesId, playlistId, itemId: item.id })
  }

  function handleToggleComplete(
    seriesId: string,
    playlistId: string,
    itemId: string,
  ) {
    setProgressMap((prev) => {
      const current = prev[playlistId] ?? loadProgress(playlistId)
      const wasDone = getItemProgress(current, itemId).completed
      const next = setCompleted(current, itemId, !wasDone)
      const merged = { ...prev, [playlistId]: next }
      if (!wasDone) {
        const stats = seriesProgressStats(library, seriesId, (id) =>
          merged[id] ?? loadProgress(id),
        )
        if (stats.percent === 100) {
          queueMicrotask(() => setCertificateSeriesId(seriesId))
        }
      }
      return merged
    })
  }

  async function handleShareApp() {
    const result = await shareContent({
      title: text.shareAppTitle,
      text: text.shareAppMessage,
    })
    if (result === 'copied') setShareNotice(text.shareCopied)
    else if (result === 'failed') setShareNotice(text.shareFailed)
    if (result === 'copied' || result === 'failed') {
      window.setTimeout(() => setShareNotice(null), 2800)
    }
  }

  function handleRemovePlaylist(playlistId: string) {
    const next = removePlaylist(library, playlistId)
    if (next === library) return
    setLibrary(next)
    clearProgress(playlistId)
    setProgressMap((prev) => {
      const copy = { ...prev }
      delete copy[playlistId]
      return copy
    })
    if (screen.name === 'player' && screen.playlistId === playlistId) {
      setScreen({ name: 'home' })
    }
  }

  async function handleAddPlaylist(url: string, title?: string) {
    const playlist = await importYoutubePlaylist(url, title)
    if (
      library.playlists.some(
        (p) => p.id === playlist.id || p.sourceUrl === playlist.sourceUrl,
      )
    ) {
      throw new Error('already')
    }
    setLibrary(addPlaylist(library, playlist))
  }

  const menuProps = {
    text,
    language,
    theme,
    isInstalled,
    playlists: library.playlists,
    onToggleLanguage: toggleLanguage,
    onToggleTheme: toggleTheme,
    onInstall: handleInstall,
    onAddPlaylist: handleAddPlaylist,
    onRemovePlaylist: handleRemovePlaylist,
    onShareApp: handleShareApp,
  }

  let main: ReactNode = null

  if (activeItem && activePlaylist && activeProgress && screen.name === 'player') {
    main = (
      <PlayerView
        item={activeItem}
        library={library}
        seriesId={screen.seriesId}
        playlistId={activePlaylist.id}
        progress={activeProgress}
        menu={menuProps}
        onClose={() => setScreen({ name: 'series', seriesId: screen.seriesId })}
        onHome={() => setScreen({ name: 'home' })}
        onToggleComplete={() =>
          handleToggleComplete(
            screen.seriesId,
            activePlaylist.id,
            activeItem.id,
          )
        }
        onNavigate={(target) =>
          openItem(screen.seriesId, target.playlistId, target.item)
        }
        text={text}
      />
    )
  } else if (screen.name === 'series') {
    const seriesDef = seriesDefById(library, screen.seriesId)
    if (seriesDef) {
      main = (
        <SeriesScreen
          library={library}
          seriesId={screen.seriesId}
          language={language}
          text={text}
          menu={menuProps}
          getProgress={ensureProgress}
          onBack={() => setScreen({ name: 'home' })}
          onOpenItem={(playlistId, item) =>
            openItem(screen.seriesId, playlistId, item)
          }
          onOpenCertificate={() => setCertificateSeriesId(screen.seriesId)}
          onOpenNextSeries={(nextId) => setScreen({ name: 'series', seriesId: nextId })}
        />
      )
    }
  } else {
    main = (
      <HomeScreen
        library={library}
        language={language}
        text={text}
        menu={menuProps}
        showInstall={!isInstalled}
        getProgress={ensureProgress}
        onOpenSeries={(seriesId) => setScreen({ name: 'series', seriesId })}
        onOpenItem={openItem}
        shareNotice={shareNotice}
      />
    )
  }

  const certificateDef = certificateSeriesId
    ? seriesDefById(library, certificateSeriesId)
    : null

  return (
    <div
      className={`app-shell${screen.name === 'player' ? ' app-shell-player' : ''}`}
    >
      <div className="atmosphere" aria-hidden="true">
        <div className="pattern-overlay" />
      </div>
      {main}
      {!isInstalled && installHint ? (
        <div className="install-hint install-hint-fixed" role="status">
          <p>{installHint}</p>
          <button
            type="button"
            className="text-btn"
            onClick={() => setInstallHint(null)}
          >
            OK
          </button>
        </div>
      ) : null}
      {certificateDef && certificateSeriesId ? (
        <CertificateModal
          seriesId={certificateSeriesId}
          def={certificateDef}
          language={language}
          text={text}
          onClose={() => setCertificateSeriesId(null)}
          onOpenNextSeries={(nextId) => {
            setCertificateSeriesId(null)
            setScreen({ name: 'series', seriesId: nextId })
          }}
        />
      ) : null}
    </div>
  )
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      className="back-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function usePageScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > threshold)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return scrolled
}

function StickyNav({ children }: { children: ReactNode }) {
  const scrolled = usePageScrolled()
  return (
    <div className={`sticky-nav${scrolled ? ' is-scrolled' : ''}`}>
      {children}
    </div>
  )
}

function StickyTopbar({ children }: { children: ReactNode }) {
  const scrolled = usePageScrolled()
  return (
    <div className={`topbar topbar-sticky${scrolled ? ' is-scrolled' : ''}`}>
      {children}
    </div>
  )
}

function NavChip({
  children,
  onClick,
  ariaLabel,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={`nav-chip${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

function CertificateModal({
  seriesId,
  def,
  language,
  text,
  onClose,
  onOpenNextSeries,
}: {
  seriesId: string
  def: NonNullable<ReturnType<typeof seriesDefById>>
  language: Language
  text: Text
  onClose: () => void
  onOpenNextSeries: (seriesId: string) => void
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const title = seriesTitle(def, language)
  const nextId = nextSeriesId(seriesId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function shareCertificate() {
    const result = await shareContent({
      title: text.certificateTitle,
      text: text.certificateShareMessage(title),
    })
    if (result === 'copied') setNotice(text.shareCopied)
    else if (result === 'failed') setNotice(text.shareFailed)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="certificate-card"
        role="dialog"
        aria-labelledby="certificate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="certificate-frame">
          <span className="certificate-ornament" aria-hidden="true">
            ✦ {seriesIcon(seriesId)} ✦
          </span>
          <p className="certificate-kicker">{text.certificateTitle}</p>
          <h2 id="certificate-title" className="certificate-heading" dir="auto">
            {title}
          </h2>
          <p className="certificate-body">{text.certificateCongrats}</p>
          <p className="certificate-detail" dir="auto">
            {text.certificateBody(title)}
          </p>
          <p className="certificate-brand">{text.brandName}</p>
        </div>
        {notice ? <p className="share-notice">{notice}</p> : null}
        <div className="certificate-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={shareCertificate}
          >
            {text.certificateShare}
          </button>
          {nextId ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onOpenNextSeries(nextId)}
            >
              {text.certificateNextSeries}
            </button>
          ) : (
            <p className="certificate-all-done">{text.certificateAllDone}</p>
          )}
          <button type="button" className="text-btn" onClick={onClose}>
            {text.certificateClose}
          </button>
        </div>
      </div>
    </div>
  )
}

function AppMenuButton({
  menu,
}: {
  menu: {
    text: Text
    language: Language
    theme: Theme
    isInstalled: boolean
    playlists: Playlist[]
    onToggleLanguage: () => void
    onToggleTheme: () => void
    onInstall: () => void
    onAddPlaylist: (url: string, title?: string) => Promise<void>
    onRemovePlaylist: (id: string) => void
    onShareApp: () => void
  }
}) {
  return <AppMenu {...menu} />
}

function InstallButton({
  text,
  onInstall,
}: {
  text: Text
  onInstall: () => void
}) {
  return (
    <button
      type="button"
      className="icon-btn install-toggle"
      onClick={onInstall}
      aria-label={text.installApp}
      data-tooltip={text.installTooltip}
    >
      <svg
        className="install-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v10" />
        <path d="m8.5 9.5 3.5 3.5 3.5-3.5" />
        <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
      </svg>
    </button>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="confirm-dialog-title" dir="auto">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="confirm-dialog-message" dir="auto">
          {message}
        </p>
        <div className="confirm-dialog-actions">
          <button type="button" className="secondary-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="danger-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function AppMenu({
  text,
  language,
  theme,
  isInstalled,
  playlists,
  onToggleLanguage,
  onToggleTheme,
  onInstall,
  onAddPlaylist,
  onRemovePlaylist,
  onShareApp,
}: {
  text: Text
  language: Language
  theme: Theme
  isInstalled: boolean
  playlists: Playlist[]
  onToggleLanguage: () => void
  onToggleTheme: () => void
  onInstall: () => void
  onAddPlaylist: (url: string, title?: string) => Promise<void>
  onRemovePlaylist: (id: string) => void
  onShareApp: () => void
}) {
  const [open, setOpen] = useState(false)
  const [playlistsOpen, setPlaylistsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<Playlist | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPlaylistsOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setPlaylistsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onAddPlaylist(url, title || undefined)
      setUrl('')
      setTitle('')
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'already'
          ? text.alreadyAdded
          : text.addError,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-menu" ref={menuRef}>
      <button
        type="button"
        className="icon-btn menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={text.menu}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          fill="currentColor"
        >
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {open ? (
        <div className="menu-panel" role="menu">
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={onToggleLanguage}
          >
            <span>{text.language}</span>
            <span className="menu-item-value">
              {language === 'ar' ? 'العربية' : 'English'}
            </span>
          </button>
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={onToggleTheme}
          >
            <span>
              {theme === 'dark' ? text.switchToLight : text.switchToDark}
            </span>
            <span className="menu-item-value" aria-hidden="true">
              {theme === 'dark' ? '☀' : '☾'}
            </span>
          </button>
          {!isInstalled ? (
            <button
              type="button"
              className="menu-item"
              role="menuitem"
              onClick={() => {
                onInstall()
                setOpen(false)
              }}
            >
              {text.installApp}
            </button>
          ) : null}

          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={() => {
              onShareApp()
              setOpen(false)
            }}
          >
            {text.shareApp}
          </button>

          <div className="menu-divider" role="separator" />

          <button
            type="button"
            className={`menu-item menu-item-expand${playlistsOpen ? ' is-open' : ''}`}
            aria-expanded={playlistsOpen}
            onClick={() => setPlaylistsOpen((v) => !v)}
          >
            <span>{text.managePlaylists}</span>
            <span className="menu-chevron" aria-hidden="true">
              ›
            </span>
          </button>

          {playlistsOpen ? (
            <div className="menu-subpanel">
              <form className="add-form menu-add-form" onSubmit={submit}>
                <label className="field">
                  <span>{text.playlistUrl}</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=..."
                    required
                    dir="ltr"
                  />
                </label>
                <label className="field">
                  <span>{text.optionalTitle}</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    dir="auto"
                  />
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <p className="form-hint">{text.rssLimitNote}</p>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={busy || !url}
                >
                  {busy ? text.adding : text.addPlaylist}
                </button>
              </form>

              <ul className="manage-list menu-manage-list">
                {playlists.map((playlist) => (
                  <li key={playlist.id} className="manage-row">
                    <div className="manage-info">
                      <p className="manage-title" dir="auto">
                        {playlist.title}
                      </p>
                      <p className="manage-meta">
                        {text.videos(playlistItemCount(playlist))}
                        {playlist.builtIn ? ` · ${text.builtIn}` : ''}
                      </p>
                    </div>
                    {!playlist.builtIn ? (
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => setPendingRemove(playlist)}
                      >
                        {text.remove}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {pendingRemove ? (
        <ConfirmDialog
          title={text.removePlaylistTitle}
          message={text.removePlaylistConfirm(pendingRemove.title)}
          confirmLabel={text.confirmRemove}
          cancelLabel={text.cancel}
          onConfirm={() => {
            onRemovePlaylist(pendingRemove.id)
            setPendingRemove(null)
          }}
          onCancel={() => setPendingRemove(null)}
        />
      ) : null}
    </div>
  )
}

function HomeScreen({
  library,
  language,
  text,
  menu,
  showInstall,
  getProgress,
  onOpenSeries,
  onOpenItem,
  shareNotice,
}: {
  library: LibraryState
  language: Language
  text: Text
  menu: React.ComponentProps<typeof AppMenuButton>['menu']
  showInstall: boolean
  getProgress: (id: string) => ProgressState
  onOpenSeries: (seriesId: string) => void
  onOpenItem: (seriesId: string, playlistId: string, item: MediaItem) => void
  shareNotice: string | null
}) {
  const stats = allSeriesProgressStats(library, getProgress)
  const continueTarget = useMemo(
    () => findContinueTarget(library, getProgress),
    [library, getProgress],
  )
  const seriesViews = useMemo(
    () => buildSeriesViews(library),
    [library],
  )

  return (
    <div className="page">
      <header className="home-hero">
        <div className="hero-ornament" aria-hidden="true">
          <span className="ornament-star">✦</span>
        </div>
        <StickyTopbar>
          <div className="brand-block">
            <p className="brand-eyebrow">{text.brandHonorific}</p>
            <h1 className="brand">{text.brandName}</h1>
            <p className="home-tagline">{text.brandTagline}</p>
          </div>
          <div className="header-controls">
            {showInstall ? (
              <InstallButton text={text} onInstall={menu.onInstall} />
            ) : null}
            <AppMenuButton menu={menu} />
          </div>
        </StickyTopbar>

        {shareNotice ? (
          <p className="share-notice share-notice-inline" role="status">
            {shareNotice}
          </p>
        ) : null}

        <div className="progress-panel home-progress">
          <div className="progress-meta">
            <span>{text.overallProgress}</span>
            <span>
              {text.progress(stats.completed, stats.total)} · {stats.percent}%
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={text.progressLabel}
            aria-valuenow={stats.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </header>

      {continueTarget ? (
        <section className="up-next" aria-label={text.continueWatching}>
          <div className="eyebrow">{text.continueWatching}</div>
          <button
            type="button"
            className="featured-card"
            onClick={() =>
              onOpenItem(
                continueTarget.seriesId,
                continueTarget.playlistId,
                continueTarget.item,
              )
            }
          >
            <span className="featured-image">
              {getThumbnailUrl(continueTarget.item) ? (
                <img
                  src={getThumbnailUrl(continueTarget.item) ?? undefined}
                  alt=""
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span className="item-thumb-fallback" aria-hidden="true" />
              )}
              <span className="play-button" aria-hidden="true">
                ▶
              </span>
            </span>
            <span className="featured-copy">
              <span className="featured-kicker" dir="auto">
                {seriesTitle(
                  seriesDefById(library, continueTarget.seriesId)!,
                  language,
                )}
              </span>
              <span className="featured-title" dir="auto">
                {continueTarget.item.title}
              </span>
              <span className="featured-meta">
                {getItemProgress(
                  getProgress(continueTarget.playlistId),
                  continueTarget.item.id,
                ).lastOpenedAt
                  ? text.continueWatching
                  : text.startWatching}
              </span>
            </span>
          </button>
        </section>
      ) : null}

      <section className="series-grid-section">
        <div className="section-head">
          <h2>{text.seriesCollection}</h2>
        </div>
        <ul className="series-grid">
          {seriesViews.map((view) => {
            const cover = seriesCover(library, view.def.id)
            const seriesStats = seriesProgressStats(
              library,
              view.def.id,
              getProgress,
            )
            return (
              <li key={view.def.id}>
                <button
                  type="button"
                  className="series-card"
                  onClick={() => onOpenSeries(view.def.id)}
                >
                  <span className="series-card-cover">
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="item-thumb-fallback" aria-hidden="true" />
                    )}
                    <span className="series-card-glow" aria-hidden="true" />
                  </span>
                  <span className="series-card-body">
                    <span className="series-card-title" dir="auto">
                      {seriesTitle(view.def, language)}
                    </span>
                    <span className="series-card-subtitle" dir="auto">
                      {seriesSubtitle(view.def, language)}
                    </span>
                    <span className="series-card-meta">
                      {text.videos(view.totalVideos)} · {seriesStats.percent}%
                    </span>
                    <span className="progress-track series-progress">
                      <span
                        className="progress-fill"
                        style={{ width: `${seriesStats.percent}%` }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function SeriesScreen({
  library,
  seriesId,
  language,
  text,
  menu,
  getProgress,
  onBack,
  onOpenItem,
  onOpenCertificate,
  onOpenNextSeries,
}: {
  library: LibraryState
  seriesId: string
  language: Language
  text: Text
  menu: React.ComponentProps<typeof AppMenuButton>['menu']
  getProgress: (id: string) => ProgressState
  onBack: () => void
  onOpenItem: (playlistId: string, item: MediaItem) => void
  onOpenCertificate: () => void
  onOpenNextSeries: (seriesId: string) => void
}) {
  const def = seriesDefById(library, seriesId)!
  const view = buildSeriesViews(library).find((v) => v.def.id === seriesId)
  const stats = seriesProgressStats(library, seriesId, getProgress)

  const nextItem = useMemo(() => {
    for (const section of view?.sections ?? []) {
      const progress = getProgress(section.playlistId)
      const found = section.items.find(
        (item) => !getItemProgress(progress, item.id).completed,
      )
      if (found) return { playlistId: section.playlistId, item: found }
    }
    const first = view?.sections[0]?.items[0]
    const firstPlaylist = view?.sections[0]?.playlistId
    return first && firstPlaylist
      ? { playlistId: firstPlaylist, item: first }
      : null
  }, [view, getProgress])

  if (!view) return null

  const showSeasonHeaders = view.sections.length > 1
  const isComplete = stats.percent === 100
  const nextSeries = nextSeriesId(seriesId)

  return (
    <div className="page page-series">
      <StickyNav>
        <div className="sticky-nav-inner">
          <NavChip onClick={onBack} ariaLabel={text.home}>
            <BackIcon />
            <span>{text.home}</span>
          </NavChip>
          <div className="sticky-nav-tools">
            <AppMenuButton menu={menu} />
          </div>
        </div>
      </StickyNav>

      <header className="hero series-hero">
        <div className="series-hero-body">
          <span className="series-hero-icon" aria-hidden="true">
            {seriesIcon(seriesId)}
          </span>
          <h1 className="series-hero-title" dir="auto">
            {seriesTitle(def, language)}
          </h1>
          <p className="series-hero-subtitle" dir="auto">
            {seriesSubtitle(def, language)}
          </p>
        </div>
        <div className="progress-panel">
          <div className="progress-meta">
            <span>{text.progress(stats.completed, stats.total)}</span>
            <span>{stats.percent}%</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={text.progressLabel}
            aria-valuenow={stats.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </header>

      {isComplete ? (
        <section className="certificate-banner">
          <p dir="auto">{text.certificateBody(seriesTitle(def, language))}</p>
          <div className="certificate-banner-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={onOpenCertificate}
            >
              {text.certificateView}
            </button>
            {nextSeries ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onOpenNextSeries(nextSeries)}
              >
                {text.certificateNextSeries}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {nextItem ? (
        <section className="up-next" aria-label={text.upNext}>
          <div className="eyebrow">{text.upNext}</div>
          <button
            type="button"
            className="featured-card"
            onClick={() => onOpenItem(nextItem.playlistId, nextItem.item)}
          >
            <span className="featured-image">
              {getThumbnailUrl(nextItem.item) ? (
                <img
                  src={getThumbnailUrl(nextItem.item) ?? undefined}
                  alt=""
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span className="item-thumb-fallback" aria-hidden="true" />
              )}
              <span className="play-button" aria-hidden="true">
                ▶
              </span>
            </span>
            <span className="featured-copy">
              <span className="featured-title" dir="auto">
                {nextItem.item.title}
              </span>
              <span className="featured-meta">
                {getItemProgress(
                  getProgress(nextItem.playlistId),
                  nextItem.item.id,
                ).lastOpenedAt
                  ? text.continueWatching
                  : text.startWatching}
              </span>
            </span>
          </button>
        </section>
      ) : null}

      <main className="sections">
        {view.sections.map((section) => (
          <section key={section.id} className="section" id={section.id}>
            {showSeasonHeaders ? (
              <div className="section-head">
                <h2 dir="auto">{section.title}</h2>
              </div>
            ) : null}
            <ul className="item-list">
              {section.items.map((item) => {
                const progress = getProgress(section.playlistId)
                const itemProgress = getItemProgress(progress, item.id)
                const thumb = getThumbnailUrl(item)
                return (
                  <li key={`${section.playlistId}-${item.id}`}>
                    <button
                      type="button"
                      className={`item-row${itemProgress.completed ? ' is-done' : ''}${itemProgress.lastOpenedAt && !itemProgress.completed ? ' is-started' : ''}`}
                      onClick={() => onOpenItem(section.playlistId, item)}
                    >
                      <span className="item-thumb">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span
                            className="item-thumb-fallback"
                            aria-hidden="true"
                          />
                        )}
                        {itemProgress.completed ? (
                          <span className="item-status is-done" aria-hidden="true">
                            ✓
                          </span>
                        ) : null}
                      </span>
                      <span className="item-body">
                        <span className="item-title" dir="auto">
                          {item.title}
                        </span>
                        <span className="item-meta">
                          {itemProgress.completed ? (
                            <span className="item-badge item-badge-done">
                              {text.completed}
                            </span>
                          ) : null}
                          {!itemProgress.completed ? (
                            <>
                              {sourceLabel(item.source)}
                              {itemProgress.lastOpenedAt
                                ? ` · ${text.started}`
                                : ''}
                            </>
                          ) : (
                            <span className="item-meta-source">
                              {sourceLabel(item.source)}
                            </span>
                          )}
                        </span>
                        <span className="sr-only">
                          {itemProgress.completed
                            ? text.completed
                            : text.notCompleted}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>
    </div>
  )
}

function PlayerView({
  item,
  library,
  seriesId,
  playlistId,
  progress,
  onClose,
  onHome,
  onToggleComplete,
  onNavigate,
  text,
  menu,
}: {
  item: MediaItem
  library: LibraryState
  seriesId: string
  playlistId: string
  progress: ProgressState
  onClose: () => void
  onHome: () => void
  onToggleComplete: () => void
  onNavigate: (target: CatalogItem) => void
  text: Text
  menu: React.ComponentProps<typeof AppMenuButton>['menu']
}) {
  const embedSrc = getEmbedSrc(item)
  const watchUrl = getWatchUrl(item)
  const done = getItemProgress(progress, item.id).completed
  const { prev, next, index, total } = findSeriesNeighbors(
    library,
    seriesId,
    playlistId,
    item.id,
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="player-page">
      <StickyNav>
        <div className="sticky-nav-inner player-sticky-nav">
          <NavChip
            onClick={onClose}
            ariaLabel={text.back}
            className="player-nav-back"
          >
            <BackIcon />
            <span>{text.back}</span>
          </NavChip>
          <p className="player-position" dir="ltr">
            {index + 1} / {total}
          </p>
          <div className="sticky-nav-tools player-nav-tools">
            <NavChip
              onClick={onHome}
              ariaLabel={text.home}
              className="player-nav-home nav-chip-icon"
            >
              <HomeIcon />
            </NavChip>
            <AppMenuButton menu={menu} />
          </div>
        </div>
      </StickyNav>

      <div className="player-stage">
        <div className="embed-frame">
          {embedSrc ? (
            <iframe
              key={item.id}
              src={embedSrc}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="origin"
            />
          ) : (
            <div className="embed-fallback">
              <p>{text.embedError}</p>
              <a href={watchUrl} target="_blank" rel="noreferrer">
                {text.openOriginal}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="player-detail">
        <h1 dir="auto">{item.title}</h1>
        <p className="item-meta">{sourceLabel(item.source)}</p>
        <div className="player-actions">
          <button
            type="button"
            className={`complete-btn${done ? ' is-complete' : ''}`}
            onClick={onToggleComplete}
            aria-pressed={done}
          >
            <span className="complete-btn-icon" aria-hidden="true">
              {done ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </span>
            <span className="complete-btn-label">
              {done ? text.completed : text.markComplete}
            </span>
            <span className="complete-btn-shine" aria-hidden="true" />
          </button>
          <div className="nav-btns">
            <button
              type="button"
              className="text-btn"
              disabled={!prev}
              onClick={() => prev && onNavigate(prev)}
            >
              {text.previous}
            </button>
            <button
              type="button"
              className="text-btn"
              disabled={!next}
              onClick={() => next && onNavigate(next)}
            >
              {text.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
