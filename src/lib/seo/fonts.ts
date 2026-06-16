import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const FONT_CACHE_DIR = resolve('node_modules/.astro/fonts')

// An old User-Agent makes Google Fonts return TTF (satori cannot read woff2).
const TTF_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1)'

type FontWeight = 400 | 600 | 700 | 800

export type LoadedFont = {
  name: string
  weight: FontWeight
  style: 'normal'
  data: Buffer
}

type FontSpec = {
  name: string
  weight: FontWeight
  family: string
  slug: string
}

// Geist matches the app sans (--font-sans); Sofia Sans matches the numeric font
// (--font-num) used for the dex id and stat values.
const FONTS: FontSpec[] = [
  { name: 'Geist', weight: 400, family: 'Geist:wght@400', slug: 'geist-400' },
  { name: 'Geist', weight: 600, family: 'Geist:wght@600', slug: 'geist-600' },
  { name: 'Sofia Sans', weight: 700, family: 'Sofia+Sans:wght@700', slug: 'sofia-sans-700' },
  { name: 'Sofia Sans', weight: 800, family: 'Sofia+Sans:wght@800', slug: 'sofia-sans-800' },
]

async function loadOne(spec: FontSpec): Promise<LoadedFont> {
  const cacheFile = resolve(FONT_CACHE_DIR, `${spec.slug}.ttf`)
  if (existsSync(cacheFile)) {
    return { name: spec.name, weight: spec.weight, style: 'normal', data: readFileSync(cacheFile) }
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${spec.family}`
  const css = await fetch(cssUrl, { headers: { 'User-Agent': TTF_USER_AGENT } }).then((res) =>
    res.text()
  )
  const match = css.match(/src:\s*url\(([^)]+\.ttf)\)/)
  if (!match) throw new Error(`[seo] could not resolve ${spec.slug} TTF url`)

  const fontResponse = await fetch(match[1])
  const data = Buffer.from(await fontResponse.arrayBuffer())
  mkdirSync(dirname(cacheFile), { recursive: true })
  writeFileSync(cacheFile, data)
  return { name: spec.name, weight: spec.weight, style: 'normal', data }
}

let cached: Promise<LoadedFont[]> | undefined

export function loadOgFonts(): Promise<LoadedFont[]> {
  if (!cached) cached = Promise.all(FONTS.map(loadOne))
  return cached
}
