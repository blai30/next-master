import { Resvg } from '@resvg/resvg-js'
import type { APIRoute } from 'astro'
import satori from 'satori'

import { loadOgFonts } from '@/lib/seo/fonts'

type SatoriNode = {
  type: string
  props: Record<string, unknown>
  key: null
}

function div(style: Record<string, unknown>, children?: unknown): SatoriNode {
  return { type: 'div', props: { style, children }, key: null }
}

export const GET: APIRoute = async () => {
  const fonts = await loadOgFonts()

  const svg = await satori(
    div(
      {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#09090b',
        color: '#fafafa',
        padding: '96px',
        justifyContent: 'center',
        fontFamily: 'Geist',
      },
      [
        div({ display: 'flex', fontSize: '96px', fontWeight: 600 }, 'Masterball'),
        div(
          { display: 'flex', fontSize: '40px', color: '#a1a1aa', marginTop: '16px' },
          'A modern Pokedex'
        ),
      ]
    ),
    { width: 1200, height: 630, fonts }
  )

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

export const prerender = true
