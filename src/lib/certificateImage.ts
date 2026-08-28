import { GRAND_ACHIEVEMENT_ID } from './series'

export type CertificateImageContent = {
  icon: string
  kicker: string
  heading: string
  congrats: string
  detail: string
  brand: string
  rtl: boolean
}

const WIDTH = 1200
const HEIGHT = 630

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = words[0] ?? ''
  for (let i = 1; i < words.length; i += 1) {
    const word = words[i]!
    const test = `${line} ${word}`
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  lines.push(line)
  return lines
}

async function ensureCertificateFonts() {
  if (!document.fonts?.load) return
  await Promise.all([
    document.fonts.load('700 52px Amiri'),
    document.fonts.load('700 30px "Noto Kufi Arabic"'),
    document.fonts.load('700 24px "Noto Kufi Arabic"'),
    document.fonts.load('400 26px "Noto Kufi Arabic"'),
    document.fonts.load('600 22px "Noto Kufi Arabic"'),
  ]).catch(() => {})
}

export async function renderCertificateImage(
  content: CertificateImageContent,
): Promise<Blob> {
  await ensureCertificateFonts()

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bg.addColorStop(0, '#f4efe4')
  bg.addColorStop(1, '#e8e0d0')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createRadialGradient(220, 120, 0, 220, 120, 420)
  glow.addColorStop(0, 'rgba(212, 232, 220, 0.85)')
  glow.addColorStop(1, 'rgba(212, 232, 220, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow2 = ctx.createRadialGradient(980, 520, 0, 980, 520, 360)
  glow2.addColorStop(0, 'rgba(232, 217, 176, 0.75)')
  glow2.addColorStop(1, 'rgba(232, 217, 176, 0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const pad = 48
  const innerX = pad
  const innerY = 56
  const innerW = WIDTH - pad * 2
  const innerH = HEIGHT - 96

  roundRect(ctx, innerX, innerY, innerW, innerH, 28)
  const frameGrad = ctx.createLinearGradient(0, innerY, 0, innerY + innerH)
  frameGrad.addColorStop(0, '#fffdf8')
  frameGrad.addColorStop(1, '#f4efe4')
  ctx.fillStyle = frameGrad
  ctx.fill()
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.direction = content.rtl ? 'rtl' : 'ltr'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  let y = innerY + 78
  ctx.font = '700 36px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#b8860b'
  ctx.fillText(`✦ ${content.icon} ✦`, WIDTH / 2, y)

  y += 52
  ctx.font = '700 24px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#b8860b'
  ctx.fillText(content.kicker, WIDTH / 2, y)

  y += 58
  ctx.font = '700 52px Amiri, "Noto Kufi Arabic", serif'
  ctx.fillStyle = '#0f4d3a'
  for (const line of wrapText(ctx, content.heading, innerW - 80)) {
    ctx.fillText(line, WIDTH / 2, y)
    y += 60
  }

  y += 8
  ctx.font = '700 30px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#b8860b'
  ctx.fillText(content.congrats, WIDTH / 2, y)

  y += 46
  ctx.font = '400 26px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#5c655f'
  for (const line of wrapText(ctx, content.detail, innerW - 100)) {
    ctx.fillText(line, WIDTH / 2, y)
    y += 38
  }

  ctx.font = '600 22px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = 'rgba(26, 36, 31, 0.72)'
  ctx.fillText(content.brand, WIDTH / 2, innerY + innerH - 36)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to render certificate image'))
    }, 'image/png')
  })
}

export function certificateImageFilename(targetId: string): string {
  const slug =
    targetId === GRAND_ACHIEVEMENT_ID
      ? 'full-journey'
      : targetId.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '')
  return `stories-prophets-certificate-${slug || 'achievement'}.png`
}
