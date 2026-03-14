import { describe, expect, it, vi } from 'vitest'

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

const getPlugin = (options = mockOptions) => {
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
