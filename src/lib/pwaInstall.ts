export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function captureInstallPrompt(event: Event): BeforeInstallPromptEvent {
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  return deferredPrompt
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null
}

export async function runInstallPrompt(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  const prompt = deferredPrompt
  if (!prompt) return 'unavailable'
  await prompt.prompt()
  const choice = await prompt.userChoice
  clearDeferredInstallPrompt()
  return choice.outcome
}

export function canNativeInstall(): boolean {
  return deferredPrompt !== null
}

// Capture before React mounts so StrictMode remounts cannot lose the prompt.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    captureInstallPrompt(event)
  })
  window.addEventListener('appinstalled', () => {
    clearDeferredInstallPrompt()
  })
}
