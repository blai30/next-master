import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /']

  if (site) {
    const sitemapUrl = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site).href
    lines.push('', `Sitemap: ${sitemapUrl}`)
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
