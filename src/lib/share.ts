export function appUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin + window.location.pathname
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export function formatShareText(text: string, url?: string): string {
  const link = url ?? appUrl()
  return `${text}\n\n${link}`
}

function copyTextFallback(text: string): boolean {
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
