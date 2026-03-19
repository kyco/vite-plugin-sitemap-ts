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
const { mockWriteFileSync, mockMkdirSync } = vi.hoisted(() => ({
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: { writeFileSync: mockWriteFileSync, mkdirSync: mockMkdirSync },
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
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

    describe('- `outDir`', () => {
      it('should write to custom outDir when specified', () => {
        const plugin = getPlugin({ ...mockOptions, outDir: 'custom/output' })
        vi.mocked(mockWriteFileSync).mockClear()
        vi.mocked(mockMkdirSync).mockClear()

        plugin.closeBundle.call({})

        expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/test/custom/output', { recursive: true })
        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/tmp/test/custom/output/sitemap.xml',
          expect.any(String),
          'utf-8',
        )
      })

      it('should strip leading slashes from custom outDir', () => {
        const plugin = getPlugin({ ...mockOptions, outDir: '/custom/output' })
        vi.mocked(mockWriteFileSync).mockClear()
        vi.mocked(mockMkdirSync).mockClear()

        plugin.closeBundle.call({})

        expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/test/custom/output', { recursive: true })
      })

      it('should use default outDir when not specified', () => {
        const plugin = getPlugin()
        vi.mocked(mockWriteFileSync).mockClear()
        vi.mocked(mockMkdirSync).mockClear()

        plugin.closeBundle.call({})

        expect(mockMkdirSync).not.toHaveBeenCalled()
        expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/test/dist/sitemap.xml', expect.any(String), 'utf-8')
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

      it('should set lastmod in yyyy-MM-dd format', () => {
        const plugin = getPlugin({ ...mockOptions, routes: ['/about'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        const match = written.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)
        expect(match).not.toBeNull()
        expect(match?.[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })

      it('should generate sitemap entries from a mix of strings and SitemapEntry objects', () => {
        const plugin = getPlugin({
          ...mockOptions,
          routes: [
            '/about',
            { loc: '/blog', changefreq: 'daily', priority: 0.8 },
            { loc: '/archive', lastmod: '2025-01-01', changefreq: 'yearly' },
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
        expect(written).toContain('<lastmod>2025-01-01</lastmod>')
        expect(written).toContain('<changefreq>yearly</changefreq>')
      })

      it('should generate hreflang alternate links', () => {
        const plugin = getPlugin({
          ...mockOptions,
          routes: [
            {
              loc: '/about',
              hreflang: [
                { lang: 'en', loc: '/about' },
                { lang: 'de', loc: '/de/ueber' },
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

      it('should use default route when routes is not provided', () => {
        const plugin = getPlugin({ hostname: 'https://example.com' })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://example.com/</loc>')
      })

      it('should handle SitemapEntry with only loc', () => {
        const plugin = getPlugin({ ...mockOptions, routes: [{ loc: '/page' }] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://example.com/page</loc>')
        expect(written).toContain('<lastmod>')
        expect(written).not.toContain('<changefreq>')
        expect(written).not.toContain('<priority>')
      })

      it('should include priority when set to 0', () => {
        const plugin = getPlugin({ ...mockOptions, routes: [{ loc: '/low', priority: 0 }] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<priority>0</priority>')
      })

      it('should escape XML special characters in routes', () => {
        const plugin = getPlugin({ ...mockOptions, routes: ['/search?q=a&b=<c>'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('&amp;')
        expect(written).toContain('&lt;c&gt;')
        expect(written).not.toContain('<loc>https://example.com/search?q=a&b=<c></loc>')
      })

      it('should normalise routes with multiple leading slashes', () => {
        const plugin = getPlugin({ ...mockOptions, routes: ['//about'] })
        vi.mocked(mockWriteFileSync).mockClear()

        plugin.closeBundle.call({})

        const written = mockWriteFileSync.mock.calls[0][1] as string
        expect(written).toContain('<loc>https://example.com/about</loc>')
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

    it('should serve valid XML content', () => {
      const plugin = getPlugin({ ...mockOptions, routes: ['/about'] })
      const use = vi.fn()
      plugin.configureServer({ middlewares: { use } })

      const handler = use.mock.calls[0][1]
      const res = { setHeader: vi.fn(), end: vi.fn() }
      handler({}, res)

      const content = res.end.mock.calls[0][0] as string
      expect(content).toContain('<?xml version="1.0"')
      expect(content).toContain('<loc>https://example.com/about</loc>')
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

    it('should skip writing in dev mode (Vite v6+)', () => {
      const plugin = getPlugin()
      vi.mocked(mockWriteFileSync).mockClear()

      plugin.closeBundle.call({ environment: { name: 'client', mode: 'dev' } })
      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should rewrite /server outDir to /client', () => {
      const serverConfig = {
        root: '/tmp/test',
        build: { outDir: 'dist/server' },
        logger: mockLogger,
      }
      const plugin = sitemap(mockOptions) as any
      plugin.configResolved(serverConfig)
      vi.mocked(mockWriteFileSync).mockClear()

      plugin.closeBundle.call({})

      expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/test/dist/client/sitemap.xml', expect.any(String), 'utf-8')
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
