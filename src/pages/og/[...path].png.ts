import type { APIRoute, GetStaticPaths } from 'astro'
import pMap from 'p-map'
import type { Pokemon, PokemonSpecies } from 'pokedex-promise-v2'

import pokeapi from '@/lib/api/pokeapi'
import { buildBaseStats } from '@/lib/domain/stats'
import type { TypeKey } from '@/lib/domain/types'
import { getSpeciesList } from '@/lib/providers'
import { getCachedCard, ogCardParam } from '@/lib/seo/og'
import { renderOgCard } from '@/lib/seo/og-card'
import { excludedVariants } from '@/lib/utils/excluded-slugs'
import { getTranslation } from '@/lib/utils/pokeapi-helpers'
import { monsterSpriteUrl } from '@/lib/utils/sprites'

export const getStaticPaths: GetStaticPaths = async () => {
  const speciesList = await getSpeciesList()
  const species = await pMap(
    speciesList.results,
    (result) => pokeapi.getResource<PokemonSpecies>(result.url),
    { concurrency: 10 }
  )

  return species.flatMap((specie) =>
    specie.varieties
      .filter((variety) => !excludedVariants.includes(variety.pokemon.name))
      .map((variety) => {
        const variant = variety.is_default ? undefined : variety.pokemon.name
        return {
          params: { path: ogCardParam(specie.name, variant) },
          props: { species: specie, variant, pokemonUrl: variety.pokemon.url },
        }
      })
  )
}

export const GET: APIRoute = async ({ props }) => {
  const { species, variant, pokemonUrl } = props as {
    species: PokemonSpecies
    variant?: string
    pokemonUrl: string
  }

  const cacheKey = variant ? `${species.id}_${variant}` : `${species.id}`
  const png = await getCachedCard(cacheKey, async () => {
    const pokemon = await pokeapi.getResource<Pokemon>(pokemonUrl)
    return renderOgCard({
      name: getTranslation(species.names, 'name')!,
      dexNumber: species.id.toString().padStart(4, '0'),
      types: pokemon.types.map((type) => type.type.name as TypeKey),
      stats: buildBaseStats(pokemon),
      spriteUrl: monsterSpriteUrl(species.id, variant),
    })
  })

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

export const prerender = true
