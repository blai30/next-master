import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import sharp from 'sharp'

import type { BaseStat, StatKey } from '@/lib/domain/stats'
import { TYPES, type TypeKey } from '@/lib/domain/types'
import { loadOgFonts } from '@/lib/seo/fonts'
import { TYPE_HEX } from '@/lib/seo/og-colors'

const WIDTH = 1200
const HEIGHT = 630
const MAX_STAT = 255
const BAR_WIDTH = 420
const BAR_HEIGHT = 30
const PILL_WIDTH = 220
const SPRITE_SCALE = 3
const SPRITE_MAX_HEIGHT = 520

const STAT_ABBR: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  speed: 'SPE',
}

export type OgCardInput = {
  name: string
  dexNumber: string
  types: TypeKey[]
  stats: BaseStat[]
  spriteUrl: string
}

type SpriteData = {
  uri: string
  width: number
  height: number
}

// Minimal satori element. The key field lets the object satisfy React's element
// type so satori accepts it without a cast.
type SatoriNode = {
  type: string
  props: Record<string, unknown>
  key: null
}

function box(style: Record<string, unknown>, children?: unknown): SatoriNode {
  return { type: 'div', props: { style, children }, key: null }
}

function image(src: string, width: number, height: number): SatoriNode {
  return { type: 'img', props: { src, width, height }, key: null }
}

const iconCache = new Map<TypeKey, string>()

function typeIconUri(type: TypeKey): string {
  const cached = iconCache.get(type)
  if (cached) return cached
  const data = readFileSync(resolve('public', `${type}.png`))
  const uri = `data:image/png;base64,${data.toString('base64')}`
  iconCache.set(type, uri)
  return uri
}

// Replicates the TypePill look: a fixed-width zinc-800 pill with a type-colored
// icon square and the uppercase type name.
function typePill(type: TypeKey): SatoriNode {
  return box(
    {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      width: `${PILL_WIDTH}px`,
      height: '56px',
      background: '#27272a',
      borderRadius: '9px',
      paddingLeft: '6px',
    },
    [
      box(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '46px',
          height: '46px',
          background: TYPE_HEX[type],
          borderRadius: '7px',
        },
        [image(typeIconUri(type), 36, 36)]
      ),
      box(
        {
          display: 'flex',
          color: '#fafafa',
          fontSize: '26px',
          fontWeight: 600,
          letterSpacing: '1px',
        },
        TYPES[type].toUpperCase()
      ),
    ]
  )
}

function statRow(stat: BaseStat): SatoriNode {
  const ratio = Math.min(stat.base / MAX_STAT, 1)
  return box({ display: 'flex', alignItems: 'center', gap: '18px' }, [
    box(
      {
        display: 'flex',
        width: '72px',
        color: '#a1a1aa',
        fontSize: '30px',
        fontWeight: 600,
        letterSpacing: '1px',
      },
      STAT_ABBR[stat.key]
    ),
    box(
      {
        display: 'flex',
        width: `${BAR_WIDTH}px`,
        height: `${BAR_HEIGHT}px`,
        background: '#27272a',
      },
      [
        box({
          display: 'flex',
          width: `${Math.round(ratio * BAR_WIDTH)}px`,
          height: `${BAR_HEIGHT}px`,
          background: '#fafafa',
        }),
      ]
    ),
    box({ display: 'flex', width: '76px', justifyContent: 'flex-end' }, [
      box(
        {
          display: 'flex',
          fontFamily: 'Sofia Sans',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          fontSize: '32px',
          color: '#fafafa',
        },
        String(stat.base)
      ),
    ]),
  ])
}

function dexNumber(dex: string): SatoriNode {
  const leadingZeros = dex.match(/^0+/)?.[0] ?? ''
  const significant = dex.slice(leadingZeros.length)
  return box(
    {
      display: 'flex',
      fontFamily: 'Sofia Sans',
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
      fontSize: '72px',
      letterSpacing: '-2px',
    },
    [
      box({ display: 'flex', color: '#27272a' }, leadingZeros),
      box({ display: 'flex', color: '#a1a1aa' }, significant),
    ]
  )
}

function card(input: OgCardInput, sprite?: SpriteData): SatoriNode {
  const header = box(
    { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' },
    [
      box(
        {
          display: 'flex',
          maxWidth: '660px',
          fontSize: '80px',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '-1px',
          color: '#fafafa',
        },
        input.name
      ),
      dexNumber(input.dexNumber),
    ]
  )

  const bottomLeft = box(
    {
      display: 'flex',
      position: 'absolute',
      bottom: '40px',
      left: '64px',
      flexDirection: 'column',
      gap: '24px',
    },
    [
      box({ display: 'flex', gap: '16px' }, input.types.map(typePill)),
      box({ display: 'flex', flexDirection: 'column', gap: '3px' }, input.stats.map(statRow)),
    ]
  )

  const children: SatoriNode[] = [header, bottomLeft]
  if (sprite) {
    children.push(
      box({ display: 'flex', position: 'absolute', bottom: '40px', right: '56px' }, [
        image(sprite.uri, sprite.width, sprite.height),
      ])
    )
  }

  return box(
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#09090b',
      padding: '64px',
      fontFamily: 'Geist',
    },
    children
  )
}

async function loadSprite(url: string): Promise<SpriteData | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const input = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(input).metadata()
    let width = (meta.width ?? 128) * SPRITE_SCALE
    let height = (meta.height ?? 128) * SPRITE_SCALE
    if (height > SPRITE_MAX_HEIGHT) {
      const factor = SPRITE_MAX_HEIGHT / height
      width = Math.round(width * factor)
      height = Math.round(height * factor)
    }
    const data = await sharp(input).resize(width, height).png().toBuffer()
    return { uri: `data:image/png;base64,${data.toString('base64')}`, width, height }
  } catch {
    return undefined
  }
}

export async function renderOgCard(input: OgCardInput): Promise<Buffer> {
  const fonts = await loadOgFonts()
  const sprite = await loadSprite(input.spriteUrl)
  const svg = await satori(card(input, sprite), { width: WIDTH, height: HEIGHT, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()
  return Buffer.from(png)
}
