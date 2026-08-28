import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

const icon = sharp(
  join(publicDir, 'qisas-al-anbiya-calligraphy-book.png'),
)

await icon.clone().resize(64, 64).png().toFile(join(publicDir, 'favicon.png'))
await icon.clone().resize(192, 192).png().toFile(join(publicDir, 'pwa-192.png'))
await icon.clone().resize(512, 512).png().toFile(join(publicDir, 'pwa-512.png'))

for (const size of [192, 512]) {
  await icon
    .clone()
    .resize(Math.round(size * 1.25), Math.round(size * 1.25))
    .extract({
      left: Math.round(size * 0.125),
      top: Math.round(size * 0.125),
      width: size,
      height: size,
    })
    .png()
    .toFile(join(publicDir, `pwa-maskable-${size}.png`))
}

const ogIcon = await icon.clone().resize(500, 500).png().toBuffer()

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 3,
    background: '#ffffff',
  },
})
  .composite([{ input: ogIcon, left: 350, top: 65 }])
  .png()
  .toFile(join(publicDir, 'og-image.png'))
