import pMap from 'p-map'
import type {
  EncounterMethod,
  LocationArea,
  Pokemon,
  PokemonEncounter,
  Version,
} from 'pokedex-promise-v2'

import pokeapi from '@/lib/api/pokeapi'
import type { VersionGroupKey } from '@/lib/domain/version-groups'
import { getTranslation } from '@/lib/utils/pokeapi-helpers'

export type LocationEncounterRow = {
  locationAreaSlug: string
  locationName: string
  versionName: string
  versionGroup: VersionGroupKey
  maxChance: number
  minLevel: number
  maxLevel: number
  methods: string[]
}

export async function buildLocationRows(pokemon: Pokemon): Promise<LocationEncounterRow[]> {
  const encounters = await pokeapi.getResource<PokemonEncounter[]>(pokemon.location_area_encounters)

  if (encounters.length === 0) return []

  const uniqueAreaUrls = [...new Set(encounters.map((e) => e.location_area.url))]
  const locationAreas = await pMap(
    uniqueAreaUrls,
    (url) => pokeapi.getResource<LocationArea>(url),
    {
      concurrency: 10,
    }
  )
  const areaMap: Record<string, LocationArea> = Object.fromEntries(
    locationAreas.map((area) => [area.name, area])
  )

  const uniqueVersionUrls = [
    ...new Set(encounters.flatMap((e) => e.version_details.map((vd) => vd.version.url))),
  ]
  const versions = await pMap(uniqueVersionUrls, (url) => pokeapi.getResource<Version>(url), {
    concurrency: 10,
  })
  const versionMap: Record<string, Version> = Object.fromEntries(versions.map((v) => [v.name, v]))

  const uniqueMethodUrls = [
    ...new Set(
      encounters.flatMap((e) =>
        e.version_details.flatMap((vd) => vd.encounter_details.map((ed) => ed.method.url))
      )
    ),
  ]
  const encounterMethods = await pMap(
    uniqueMethodUrls,
    (url) => pokeapi.getResource<EncounterMethod>(url),
    { concurrency: 10 }
  )
  const methodMap: Record<string, EncounterMethod> = Object.fromEntries(
    encounterMethods.map((m) => [m.name, m])
  )

  const rowMap = new Map<string, LocationEncounterRow>()

  for (const encounter of encounters) {
    const area = areaMap[encounter.location_area.name]
    if (!area) continue
    const locationName = getTranslation(area.names, 'name') || area.name

    for (const versionDetail of encounter.version_details) {
      if (versionDetail.encounter_details.length === 0) continue
      const version = versionMap[versionDetail.version.name]
      if (!version) continue
      const versionName = getTranslation(version.names, 'name') ?? versionDetail.version.name
      const versionGroup = version.version_group.name as VersionGroupKey
      const key = `${area.name}__${versionGroup}__${versionDetail.version.name}`
      const methods = [
        ...new Set(
          versionDetail.encounter_details.map((ed) => {
            const method = methodMap[ed.method.name]
            return getTranslation(method?.names, 'name') ?? ed.method.name
          })
        ),
      ]
      const minLevel = Math.min(...versionDetail.encounter_details.map((ed) => ed.min_level))
      const maxLevel = Math.max(...versionDetail.encounter_details.map((ed) => ed.max_level))

      const existing = rowMap.get(key)
      if (existing) {
        existing.methods = [...new Set([...existing.methods, ...methods])]
        existing.minLevel = Math.min(existing.minLevel, minLevel)
        existing.maxLevel = Math.max(existing.maxLevel, maxLevel)
        existing.maxChance = Math.max(existing.maxChance, versionDetail.max_chance)
      } else {
        rowMap.set(key, {
          locationAreaSlug: area.name,
          locationName,
          versionName,
          versionGroup,
          maxChance: versionDetail.max_chance,
          minLevel,
          maxLevel,
          methods,
        })
      }
    }
  }

  return [...rowMap.values()]
}
