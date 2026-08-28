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

const APP_ICON_PATH = '/pwa-512.png'
export const APP_ICON_FILENAME = 'stories-of-the-prophets-icon.png'

let cachedAppIconBlob: Blob | null = null
let appIconBlobPromise: Promise<Blob> | null = null

export function prefetchAppIconBlob(): void {
  if (cachedAppIconBlob || appIconBlobPromise) return
  appIconBlobPromise = fetch(APP_ICON_PATH)
    .then((response) => {
      if (!response.ok) throw new Error('Failed to load app icon')
      return response.blob()
    })
    .then((blob) => {
      cachedAppIconBlob =
        blob.type === 'image/png' ? blob : blob.slice(0, blob.size, 'image/png')
      return cachedAppIconBlob
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

export async function shareImageFile(options: {
  blob: Blob
  filename: string
  title: string
  text?: string
}): Promise<ShareResult> {
  const shareText = options.text ?? options.title

  if (typeof navigator.share === 'function') {
    const file = new File([options.blob], options.filename, {
      type: 'image/png',
      lastModified: Date.now(),
    })

    const payloads: ShareData[] = [
      { files: [file], text: shareText },
      { files: [file], title: options.title, text: shareText },
      { files: [file], title: options.title },
      { files: [file] },
    ]

    for (const payload of payloads) {
      try {
        if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
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
