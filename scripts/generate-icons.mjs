import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

const variants = [
  { file: 'app-icon.svg', outputs: ['pwa-192.png', 'pwa-512.png'] },
  {
    file: 'app-icon-maskable.svg',
    outputs: ['pwa-maskable-192.png', 'pwa-maskable-512.png'],
  },
]

const sizes = {
  'pwa-192.png': 192,
  'pwa-512.png': 512,
  'pwa-maskable-192.png': 192,
  'pwa-maskable-512.png': 512,
}

for (const { file, outputs } of variants) {
  const svg = readFileSync(join(publicDir, file))
  for (const name of outputs) {
    const size = sizes[name]
    await sharp(svg).resize(size, size).png().toFile(join(publicDir, name))
    console.log(`wrote ${name}`)
  }
}
