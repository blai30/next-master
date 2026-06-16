export type JsonLd = Record<string, unknown>

export type BreadcrumbItem = {
  name: string
  url: string
}

export type MonsterProperty = {
  name: string
  value: string | number
}

export function buildWebSiteJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Masterball',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildMonsterJsonLd(input: {
  name: string
  url: string
  image: string
  description: string
  properties: MonsterProperty[]
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    additionalProperty: input.properties.map((property) => ({
      '@type': 'PropertyValue',
      name: property.name,
      value: property.value,
    })),
  }
}
