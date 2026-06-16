import type { Pokemon, PokemonSpecies } from 'pokedex-promise-v2'

import { TYPES, type TypeKey } from '@/lib/domain/types'
import { getTranslation } from '@/lib/utils/pokeapi-helpers'

const DESCRIPTION_MAX = 155

// Strip soft hyphens and collapse the form-feed and newline characters pokeapi
// embeds in flavor text so it reads as a single clean line.
export function cleanFlavorText(raw: string): string {
  return raw.replace(/\xad/g, '').replace(/\s+/g, ' ').trim()
}

export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/)
  return match ? match[0].trim() : text
}

function pickEnglishFlavor(species: PokemonSpecies): string | undefined {
  const english = species.flavor_text_entries.filter((entry) => entry.language.name === 'en')
  if (english.length === 0) return undefined
  return english[english.length - 1].flavor_text
}

function truncate(text: string, max: number = DESCRIPTION_MAX): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}...`
}

export function buildMonsterTitle(name: string, dexNumber: string): string {
  return `${name} #${dexNumber} | Masterball`
}

// Concise lead for the meta and og description: genus, dex number, types, and the
// first sentence of English Pokedex flavor text, truncated on a word boundary.
export function buildMonsterDescription(species: PokemonSpecies, pokemon: Pokemon): string {
  const name = getTranslation(species.names, 'name')!
  const genus = getTranslation(species.genera, 'genus')
  const dexNumber = species.id.toString().padStart(4, '0')
  const types = pokemon.types.map((type) => TYPES[type.type.name as TypeKey]).join('/')
  const flavorRaw = pickEnglishFlavor(species)
  const flavor = flavorRaw ? firstSentence(cleanFlavorText(flavorRaw)) : ''

  const lead = genus
    ? `${name}, the ${genus} (#${dexNumber}). ${types} type.`
    : `${name} (#${dexNumber}). ${types} type.`

  return truncate(flavor ? `${lead} ${flavor}` : lead)
}
