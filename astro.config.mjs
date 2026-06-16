import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { loadCache, saveCache } from './src/lib/api/cache'

// Persist pokeapi responses across builds so we only hit the network for resources
// that are not already cached on disk.
const pokeapiCache = {
  name: 'pokeapi-cache',
  hooks: {
    'astro:build:start': () => loadCache(),
    'astro:build:done': () => saveCache(),
    'astro:server:start': () => loadCache(),
  },
}

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL,
  base: process.env.PUBLIC_BASEPATH,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    resolve: {
      alias: {
        '@': new URL('.', import.meta.url).pathname,
      },
    },
  },
  integrations: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    sitemap({
      filter: (page) => !page.includes('/data/'),
    }),
    pokeapiCache,
  ],
})
