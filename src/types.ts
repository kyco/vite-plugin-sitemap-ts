export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export type SitemapEntry = {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: ChangeFreq
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
   * An array of routes to include in the sitemap.
   *
   * **Default: `['/']`**
   */
  routes?: string[]
}
