import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true).then(() => {
      window.location.reload()
    })
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    const check = () => {
      void registration.update()
    }

    // Installed PWAs often stay on an old build until the SW checks again.
    check()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    window.addEventListener('focus', check)
    window.setInterval(check, 30 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
