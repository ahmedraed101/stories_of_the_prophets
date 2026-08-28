import { GRAND_ACHIEVEMENT_ID } from './series'

export type CertificateImageContent = {
  motto: string
  kicker: string
  subjectLine: string
  awardedTo: string
  recipientName: string
  appreciation: string
  closing: string
  rtl: boolean
}

const WIDTH = 1200
const HEIGHT = 630

const CERTIFICATE_FONT_SPECS = [
  '400 24px Amiri',
  '700 40px Amiri',
  '700 44px Amiri',
  '700 22px "Noto Kufi Arabic"',
  '700 26px "Noto Kufi Arabic"',
  '400 22px "Noto Kufi Arabic"',
  '600 24px "Noto Kufi Arabic"',
] as const

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

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
): number {
  let y = startY
  for (const line of lines) {
    ctx.fillText(line, centerX, y)
    y += lineHeight
  }
  return y
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to render certificate image'))
    }, 'image/png')
  })
}

async function ensureCertificateFonts(): Promise<void> {
  if (!document.fonts?.load) return

  await Promise.all(CERTIFICATE_FONT_SPECS.map((spec) => document.fonts.load(spec)))
  await document.fonts.ready

  const ready = CERTIFICATE_FONT_SPECS.every((spec) => document.fonts.check(spec))
  if (!ready) {
    await new Promise((resolve) => window.setTimeout(resolve, 120))
    await document.fonts.ready
  }
}

function drawCertificate(
  ctx: CanvasRenderingContext2D,
  content: CertificateImageContent,
): void {
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
  const innerY = 48
  const innerW = WIDTH - pad * 2
  const innerH = HEIGHT - 88

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

  const centerX = WIDTH / 2
  let y = innerY + 62

  ctx.font = '400 24px Amiri, "Noto Kufi Arabic", serif'
  ctx.fillStyle = '#5c655f'
  y = drawLines(
    ctx,
    wrapText(ctx, content.motto, innerW - 120),
    centerX,
    y,
    34,
  )

  y += 18
  ctx.font = '700 26px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#b8860b'
  ctx.fillText(content.kicker, centerX, y)

  y += 44
  ctx.font = '700 40px Amiri, "Noto Kufi Arabic", serif'
  ctx.fillStyle = '#0f4d3a'
  y = drawLines(
    ctx,
    wrapText(ctx, content.subjectLine, innerW - 100),
    centerX,
    y,
    48,
  )

  y += 28
  ctx.font = '400 22px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#5c655f'
  y = drawLines(
    ctx,
    wrapText(ctx, content.awardedTo, innerW - 120),
    centerX,
    y,
    32,
  )

  if (content.recipientName) {
    y += 12
    ctx.font = '700 44px Amiri, "Noto Kufi Arabic", serif'
    ctx.fillStyle = '#0f4d3a'
    y = drawLines(
      ctx,
      wrapText(ctx, content.recipientName, innerW - 120),
      centerX,
      y + 38,
      50,
    )
  }

  y += 20
  ctx.font = '400 22px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#5c655f'
  y = drawLines(
    ctx,
    wrapText(ctx, content.appreciation, innerW - 120),
    centerX,
    y,
    32,
  )

  ctx.font = '600 24px "Noto Kufi Arabic", sans-serif'
  ctx.fillStyle = '#0f4d3a'
  ctx.fillText(content.closing, centerX, innerY + innerH - 40)
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

  drawCertificate(ctx, content)
  return canvasToBlob(canvas)
}

export function certificateImageFilename(targetId: string): string {
  const slug =
    targetId === GRAND_ACHIEVEMENT_ID
      ? 'full-journey'
      : targetId.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '')
  return `stories-prophets-certificate-${slug || 'achievement'}.png`
}
