import { describe, expect, it, vi } from 'vitest'

import { sitemap } from '../plugin'

const mockLogger = { info: vi.fn() }
const mockConfig = {
  build: { outDir: 'dist' },
  logger: mockLogger,
}

const getPlugin = (options = {}) => {
  const plugin = sitemap(options) as any
  plugin.configResolved(mockConfig)
  return plugin
}

describe('+ sitemap()', () => {
  it('should return a plugin with the correct name', () => {
    const plugin = sitemap()
    expect(plugin.name).toBe('vite-plugin-sitemap-ts')
  })

  describe('- options', () => {
    describe('- `enabled`', () => {
      it('should be `true` by default', () => {
        const plugin = sitemap() as any
        expect(plugin.apply()).toBe(true)
      })

      it('should be disabled when `enabled: false`', () => {
        const plugin = sitemap({ enabled: false }) as any
        expect(plugin.apply()).toBe(false)
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
      const plugin = getPlugin({ block: 'none' })
      const use = vi.fn()
      plugin.configureServer({ middlewares: { use } })

      const handler = use.mock.calls[0][1]
      const res = { setHeader: vi.fn(), end: vi.fn() }
      handler({}, res)

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/xml; charset=utf-8')
    })
  })

  describe('- hook:generateBundle()', () => {
    it('should emit sitemap.xml in the client bundle only (Vite v6+)', () => {
      const plugin = getPlugin()
      const emitFile = vi.fn()

      plugin.generateBundle.call({ emitFile, environment: { name: 'ssr' } })
      expect(emitFile).not.toHaveBeenCalled()

      plugin.generateBundle.call({ emitFile, environment: { name: 'client' } })
      expect(emitFile).toHaveBeenCalledTimes(1)
    })

    it('should emit sitemap.xml when Environment API is not available (Vite pre v6)', () => {
      const plugin = getPlugin()
      const emitFile = vi.fn()

      plugin.generateBundle.call({ emitFile })
      expect(emitFile).toHaveBeenCalledTimes(1)
    })

    it('should fail gracefully when sitemap.xml generation fails', () => {
      const plugin = getPlugin()
      const emitFile = vi.fn(() => {
        throw new Error('fail')
      })

      expect(() => plugin.generateBundle.call({ emitFile })).not.toThrow()
    })
  })
})
