import appIconBundledUrl from '../assets/app-icon.png?url'

export function appUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin + window.location.pathname
}

export type ShareResult =
  | 'shared'
  | 'copied'
  | 'cancelled'
  | 'failed'
  | 'downloaded'
  | 'opened'
  | 'saved_and_copied'
  | 'opened_and_copied'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Save image on disk (desktop) or open in a new tab (mobile) for long-press save. */
export function saveImageBlob(blob: Blob, filename: string): 'downloaded' | 'opened' {
  const url = URL.createObjectURL(blob)

  if (isMobileDevice()) {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) {
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
      return 'opened'
    }
  }

  downloadBlob(blob, filename)
  return 'downloaded'
}

export function formatShareText(text: string, url?: string): string {
  const link = url ?? appUrl()
  return `${text}\n\n${link}`
}

export const APP_ICON_FILENAME = 'stories-of-the-prophets-icon.png'

let cachedAppIconBlob: Blob | null = null
let appIconBlobPromise: Promise<Blob> | null = null
const appIconReadyListeners = new Set<() => void>()

function notifyAppIconReady(): void {
  for (const listener of appIconReadyListeners) listener()
}

export function isAppIconReady(): boolean {
  return cachedAppIconBlob !== null
}

export function subscribeAppIconReady(listener: () => void): () => void {
  appIconReadyListeners.add(listener)
  if (cachedAppIconBlob) listener()
  return () => appIconReadyListeners.delete(listener)
}

function resolveAppIconUrl(): string {
  if (typeof window === 'undefined') return appIconBundledUrl
  return new URL(appIconBundledUrl, window.location.origin).href
}

function isPngBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
}

async function blobToShareablePng(source: Blob): Promise<Blob> {
  const header = new Uint8Array(await source.slice(0, 8).arrayBuffer())
  if (!isPngBytes(header)) {
    throw new Error('Invalid app icon')
  }

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(source)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      ctx.drawImage(bitmap, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('toBlob failed'))),
          'image/png',
        )
      })
      return blob
    } finally {
      bitmap.close()
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('toBlob failed'))),
        'image/png',
      )
    }
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = URL.createObjectURL(source)
  })
}

async function loadShareableAppIconBlob(): Promise<Blob> {
  const response = await fetch(resolveAppIconUrl(), { cache: 'force-cache' })
  if (!response.ok) throw new Error('Failed to load app icon')
  return blobToShareablePng(await response.blob())
}

export function prefetchAppIconBlob(): void {
  if (cachedAppIconBlob || appIconBlobPromise) return
  appIconBlobPromise = loadShareableAppIconBlob()
    .then((blob) => {
      cachedAppIconBlob = blob
      notifyAppIconReady()
      return blob
    })
    .catch(() => {
      appIconBlobPromise = null
      throw new Error('Failed to load app icon')
    })
}

export function getCachedAppIconBlob(): Blob | null {
  return cachedAppIconBlob
}

export async function ensureAppIconBlob(): Promise<Blob | null> {
  if (cachedAppIconBlob) return cachedAppIconBlob
  prefetchAppIconBlob()
  if (!appIconBlobPromise) return null
  try {
    return await appIconBlobPromise
  } catch {
    return null
  }
}

export async function shareCachedAppIcon(options: {
  blob: Blob
  title: string
  text: string
  url?: string
}): Promise<ShareResult> {
  const shareText = formatShareText(options.text, options.url)
  return shareImageFile({
    blob: options.blob,
    filename: APP_ICON_FILENAME,
    title: options.title,
    text: shareText,
    mode: 'files-first',
  })
}

export function copyTextFallback(text: string): boolean {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

export function copyShareTextSync(text: string, url?: string): boolean {
  return copyTextFallback(formatShareText(text, url))
}

/** HTTP / non-secure fallback — must run synchronously inside the tap handler. */
export function shareImageWithoutSecureContext(options: {
  blob: Blob
  filename: string
  text: string
}): ShareResult {
  const saveResult = saveImageBlob(options.blob, options.filename)
  const copied = copyTextFallback(options.text)

  if (saveResult === 'opened' && copied) return 'opened_and_copied'
  if (saveResult === 'downloaded' && copied) return 'saved_and_copied'
  if (saveResult === 'opened') return 'opened'
  if (saveResult === 'downloaded') return 'downloaded'
  if (copied) return 'copied'
  return 'failed'
}

export async function shareContent(options: {
  title: string
  text: string
  url?: string
}): Promise<ShareResult> {
  const url = options.url ?? appUrl()

  if (typeof navigator.share === 'function') {
    try {
      const withUrl = { title: options.title, text: options.text, url }
      const textOnly = { title: options.title, text: formatShareText(options.text, url) }

      if (!navigator.canShare || navigator.canShare(withUrl)) {
        await navigator.share(withUrl)
        return 'shared'
      }
      if (!navigator.canShare || navigator.canShare(textOnly)) {
        await navigator.share(textOnly)
        return 'shared'
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  const fullText = formatShareText(options.text, url)

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullText)
      return 'copied'
    } catch {
      // Fall through to legacy copy (works on HTTP when triggered by a tap).
    }
  }

  if (copyTextFallback(fullText)) return 'copied'

  return 'failed'
}

export type ShareImageMode = 'caption-required' | 'files-first'

export async function shareImageFile(options: {
  blob: Blob
  filename: string
  title: string
  text?: string
  /** Certificate share keeps caption; app icon share prefers image-only. */
  mode?: ShareImageMode
}): Promise<ShareResult> {
  const shareText = options.text ?? options.title
  const mode = options.mode ?? 'caption-required'

  if (typeof navigator.share === 'function') {
    const file = new File([options.blob], options.filename, {
      type: 'image/png',
      lastModified: Date.now(),
    })

    const captionPayloads: ShareData[] = [
      { files: [file], text: shareText },
      { files: [file], title: options.title, text: shareText },
      { files: [file], title: shareText },
    ]
    const filesFirstPayloads: ShareData[] = [
      { files: [file] },
      { files: [file], title: options.title },
      { files: [file], title: options.title, text: shareText },
      { files: [file], text: shareText },
    ]
    const payloads = mode === 'files-first' ? filesFirstPayloads : captionPayloads
    const skipCanShare = mode === 'caption-required'

    for (const payload of payloads) {
      try {
        if (
          !skipCanShare &&
          typeof navigator.canShare === 'function' &&
          !navigator.canShare(payload)
        ) {
          continue
        }
        await navigator.share(payload)
        return 'shared'
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareText)
      saveImageBlob(options.blob, options.filename)
      return 'saved_and_copied'
    } catch {
      // Fall through.
    }
  }

  if (copyTextFallback(shareText)) {
    saveImageBlob(options.blob, options.filename)
    return 'saved_and_copied'
  }

  saveImageBlob(options.blob, options.filename)
  return 'downloaded'
}

export function canShareImageFiles(): boolean {
  return typeof navigator.share === 'function' && window.isSecureContext
}

export async function copyShareText(text: string, url?: string): Promise<boolean> {
  const fullText = formatShareText(text, url)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullText)
      return true
    } catch {
      // Fall through.
    }
  }
  return copyTextFallback(fullText)
}
