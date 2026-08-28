export function appUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin + window.location.pathname
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareContent(options: {
  title: string
  text: string
  url?: string
}): Promise<ShareResult> {
  const url = options.url ?? appUrl()
  const fullText = `${options.text}\n\n${url}`

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(fullText)
    return 'copied'
  } catch {
    return 'failed'
  }
}
