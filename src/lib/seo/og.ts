import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// Bump when the card layout changes so cached PNGs from a prior design are ignored.
const CARD_VERSION = 'v3'
const CARD_DIR = resolve('node_modules/.astro/og-cards')

// The [...path] param for a monster's card: 'charizard' or 'charizard/charizard-mega-x'.
export function ogCardParam(slug: string, variant?: string): string {
  return variant ? `${slug}/${variant}` : slug
}

// Path (relative to the site base) of a monster's card PNG.
export function ogImagePath(slug: string, variant?: string): string {
  return `og/${ogCardParam(slug, variant)}.png`
}

export async function getCachedCard(key: string, render: () => Promise<Buffer>): Promise<Buffer> {
  const file = resolve(CARD_DIR, `${CARD_VERSION}_${key}.png`)
  if (existsSync(file)) return readFileSync(file)
  const png = await render()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, png)
  return png
}
