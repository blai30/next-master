import type { TypeKey } from '@/lib/domain/types'

// Mirror of the --color-<type> tokens in globals.css. satori needs concrete hex
// values because it cannot resolve CSS custom properties.
export const TYPE_HEX: Record<TypeKey, string> = {
  normal: '#9fa19f',
  fighting: '#ff8000',
  flying: '#81b9ef',
  poison: '#9141cb',
  ground: '#915121',
  rock: '#afa981',
  bug: '#91a119',
  ghost: '#704170',
  steel: '#60a1b8',
  fire: '#e62829',
  water: '#2980ef',
  grass: '#3fa129',
  electric: '#fac000',
  psychic: '#ef4179',
  ice: '#3dcef3',
  dragon: '#5060e1',
  dark: '#624d4e',
  fairy: '#ef70ef',
}
