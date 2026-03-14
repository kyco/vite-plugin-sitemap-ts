import { defineConfig } from 'vite'

import { sitemap } from '../../src/index.ts'

export default defineConfig({
  plugins: [
    sitemap({
      enabled: true,
    }),
  ],
})
