export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export type HrefLangEntry = {
  lang: string
  loc: string
}

export type SitemapEntry = {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: ChangeFreq
  hreflang?: HrefLangEntry[]
}

export type Options = {
  /**
   * Toggle the plugin on or off. Useful if you want to disable the plugin, e.g. in development mode.
   *
   * **Default: `true`**
   */
  enabled?: boolean

  /**
   * The hostname of the site, used to build the full URLs in the sitemap.
   *
   * **Example: `'https://example.com'`**
   */
  hostname: string

  /**
   * The routes to include in the sitemap. Pass either strings or `SitemapEntry` objects
   * for full control over "loc", "lastmod", "changefreq", "priority" and "hreflang".
   *
   * **Default: `['/']`**
   *
   * ---
   *
   * Example:
   * ```typescript
   * routes: [
   *   '/',
   *   '/about',
   *   { loc: '/blog', lastmod: '2026-01-01', changefreq: 'weekly', priority: 0.8 },
   * ]
   * ```
   */
  routes?: (string | SitemapEntry)[]

  /**
   * Custom output directory for the generated `sitemap.xml` file. When specified, the file is
   * written to this directory instead of the default Vite build output directory.
   *
   * The path is resolved relative to the Vite project root.
   *
   * **Default: `undefined`** (uses Vite's `build.outDir`)
   *
   * ---
   *
   * Example:
   * ```typescript
   * sitemap({
   *   outDir: 'public',
   * })
   * ```
   */
  outDir?: string
}
