import { describe, expect, it, vi } from 'vitest'

import type { Options } from '../types'
import { sitemap } from '../plugin'

const mockLogger = { info: vi.fn() }
const mockConfig = {
  root: '/tmp/test',
  build: { outDir: 'dist' },
  logger: mockLogger,
}
const mockOptions = { hostname: 'https://example.com' }
const { mockWriteFileSync } = vi.hoisted(() => ({
  mockWriteFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: { writeFileSync: mockWriteFileSync },
  writeFileSync: mockWriteFileSync,
}))

const getPlugin = (options: Options = mockOptions) => {
  const plugin = sitemap(options) as any
  plugin.configResolved(mockConfig)
  return plugin
}

describe('+ sitemap()', () => {
  it('should return a plugin with the correct name', () => {
    const plugin = sitemap(mockOptions)
    expect(plugin.name).toBe('vite-plugin-sitemap-ts')
  })

  describe('- options', () => {
    describe('- `enabled`', () => {
      it('should be `true` by default', () => {
        const plugin = sitemap(mockOptions) as any
        expect(plugin.apply()).toBe(true)
      })

      it('should be disabled when `enabled: false`', () => {
        const plugin = sitemap({ ...mockOptions, enabled: false }) as any
        expect(plugin.apply()).toBe(false)
      })
    })

    describe('- `hostname`', () => {
      it('should throw when hostname is not specified', () => {
        expect(() => sitemap({ hostname: '' })).toThrow(
          'Sitemap hostname is not set and required to build the sitemap.',
        )
      })

      it('should use hostname as the base URL for all routes', () => {
        const plugin = getPlugin({ hostname: 'https://mysite.org', routes: ['/about'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://mysite.org/about</loc>')
      })

      it('should strip trailing slash from hostname', () => {
        const plugin = getPlugin({ hostname: 'https://mysite.org/', routes: ['/about'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://mysite.org/about</loc>')
        expect(written).not.toContain('https://mysite.org//about')
      })
    })

    describe('- `routes`', () => {
      it('should generate sitemap entries from string routes', () => {
        const plugin = getPlugin({ ...mockOptions, routes: ['/', '/about', '/contact'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://example.com/</loc>')
        expect(written).toContain('<loc>https://example.com/about</loc>')
        expect(written).toContain('<loc>https://example.com/contact</loc>')
      })

      it('should generate sitemap entries from a mix of strings and SitemapEntry objects', () => {
        const plugin = getPlugin({
          ...mockOptions,
          routes: [
            '/about',
            { loc: '/blog', changefreq: 'daily', priority: 0.8 },
            { loc: '/archive', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'yearly' },
          ],
        })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://example.com/about</loc>')

        expect(written).toContain('<loc>https://example.com/blog</loc>')
        expect(written).toContain('<changefreq>daily</changefreq>')
        expect(written).toContain('<priority>0.8</priority>')

        expect(written).toContain('<loc>https://example.com/archive</loc>')
        expect(written).toContain('<lastmod>2025-01-01T00:00:00.000Z</lastmod>')
        expect(written).toContain('<changefreq>yearly</changefreq>')
      })

      it('should generate hreflang alternate links', () => {
        const plugin = getPlugin({
          ...mockOptions,
          routes: [
            {
              loc: '/about',
              hreflang: [
                { lang: 'en', href: 'https://example.com/about' },
                { lang: 'de', href: 'https://example.com/de/ueber' },
              ],
            },
          ],
        })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
        expect(written).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://example.com/about" />')
        expect(written).toContain('<xhtml:link rel="alternate" hreflang="de" href="https://example.com/de/ueber" />')
      })

      it('should NOT include xhtml namespace when no hreflang entries exist', () => {
        const plugin = getPlugin({ ...mockOptions, routes: ['/about'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).not.toContain('xmlns:xhtml')
      })
    })
  })

  describe('- dev server middleware', () => {
    it('should register middleware on /sitemap.xml', () => {
      const plugin = getPlugin()
      const use = vi.fn()
      const server = { middlewares: { use } }

      plugin.configureServer(server)

      expect(use).toHaveBeenCalledWith('/sitemap.xml', expect.any(Function))
    })

    it('should serve sitemap.xml with correct headers', () => {
      const plugin = getPlugin()
      const use = vi.fn()
      plugin.configureServer({ middlewares: { use } })

      const handler = use.mock.calls[0][1]
      const res = { setHeader: vi.fn(), end: vi.fn() }
      handler({}, res)

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/xml; charset=utf-8')
    })
  })

  describe('- hook:closeBundle()', () => {
    it('should write sitemap.xml in the client bundle only (Vite v6+)', () => {
      const plugin = getPlugin()
      vi.mocked(mockWriteFileSync).mockClear()

      plugin.closeBundle.call({ environment: { name: 'ssr' } })
      expect(mockWriteFileSync).not.toHaveBeenCalled()

      plugin.closeBundle.call({ environment: { name: 'client' } })
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    })

    it('should write sitemap.xml when Environment API is not available (Vite pre v6)', () => {
      const plugin = getPlugin()
      vi.mocked(mockWriteFileSync).mockClear()

      plugin.closeBundle.call({})
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    })

    it('should throw when sitemap.xml generation fails', () => {
      const plugin = getPlugin()
      vi.mocked(mockWriteFileSync).mockImplementationOnce(() => {
        throw new Error('fail')
      })

      expect(() => plugin.closeBundle.call({})).toThrow()
    })
  })
})
