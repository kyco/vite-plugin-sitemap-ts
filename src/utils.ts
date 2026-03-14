import type { SitemapEntry } from './types'

const SPACER = '  '
const DSPACER = SPACER + SPACER

const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`
const xmlSchema = (content: string, hasHreflang: boolean) => {
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasHreflang ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>\n${content}\n</urlset>`
}

const escapeXml = (value: unknown): string => {
  return String(value).replace(/[&<>"']/g, (val) => {
    switch (val) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return val
    }
  })
}

export const generateSitemap = (entries: SitemapEntry[]): string => {
  let hasHreflang = false

  const urls = entries
    .map((entry) => {
      let sitemapEntry = `${DSPACER}<loc>${escapeXml(entry.loc)}</loc>`
      if (entry.lastmod) {
        sitemapEntry += `\n${DSPACER}<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
      }
      if (entry.changefreq) {
        sitemapEntry += `\n${DSPACER}<changefreq>${escapeXml(entry.changefreq)}</changefreq>`
      }
      if (entry.priority !== undefined) {
        sitemapEntry += `\n${DSPACER}<priority>${escapeXml(entry.priority)}</priority>`
      }
      if (entry.hreflang?.length) {
        hasHreflang = true
        entry.hreflang.forEach((alt) => {
          sitemapEntry += `\n${DSPACER}<xhtml:link rel="alternate" hreflang="${escapeXml(alt.lang)}" href="${escapeXml(alt.href)}" />`
        })
      }
      return `${SPACER}<url>\n${sitemapEntry}\n${SPACER}</url>`
    })
    .join('\n')

  return `${xmlHeader}\n${xmlSchema(urls, hasHreflang)}`
}

export const buildSitemapEntries = (options: {
  hostname: string
  routes: (string | SitemapEntry)[]
}): SitemapEntry[] => {
  const host = options.hostname.replace(/\/$/, '')
  const lastmod = new Date().toISOString()

  return options.routes.map((route) => {
    if (typeof route === 'string') {
      return {
        loc: `${host}/${route.replace(/^\/+/, '')}`,
        lastmod,
      }
    }

    return {
      ...route,
      loc: `${host}/${route.loc.replace(/^\/+/, '')}`,
      lastmod: route.lastmod ?? lastmod,
    }
  })
}

export const logColor = (color: 'red' | 'green' | 'yellow', text: string, bold = false) => {
  const colorCode = {
    red: bold ? '\x1b[1;31m' : '\x1b[31m',
    green: bold ? '\x1b[1;32m' : '\x1b[32m',
    yellow: bold ? '\x1b[1;33m' : '\x1b[33m',
  }

  return `${colorCode[color]}${text}${LOGGER_CLEAR}`
}

export const LOGGER_CLEAR = '\x1b[0m'
export const LOGGER_PREFIX = logColor('yellow', '[sitemap-ts]', true)
export const LOGGER_SUCCESS = logColor('green', '✓', true)
export const LOGGER_FAILURE = logColor('red', '✗', true)
