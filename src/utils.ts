import type { SitemapEntry } from './types'

const SPACER = '  '
const DSPACER = SPACER + SPACER

const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`
const xmlSchema = (content: string) => {
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${content}\n</urlset>`
}

export const generateSitemap = (entries: SitemapEntry[]): string => {
  const urls = entries
    .map((entry) => {
      let sitemapEntry = `${DSPACER}<loc>${entry.loc}</loc>`
      if (entry.lastmod) {
        sitemapEntry += `\n${DSPACER}<lastmod>${entry.lastmod}</lastmod>`
      }
      if (entry.changefreq) {
        sitemapEntry += `\n${DSPACER}<changefreq>${entry.changefreq}</changefreq>`
      }
      if (entry.priority !== undefined) {
        sitemapEntry += `\n${DSPACER}<priority>${entry.priority}</priority>`
      }
      return `${SPACER}<url>\n${sitemapEntry}\n${SPACER}</url>`
    })
    .join('\n')

  return `${xmlHeader}\n${xmlSchema(urls)}`
}

export const buildSitemapEntries = (options: { hostname: string; routes: string[] }): SitemapEntry[] => {
  const host = options.hostname.replace(/\/$/, '')
  const lastmod = new Date().toISOString()

  return options.routes.map((route) => {
    return {
      loc: `${host}${route}`,
      lastmod,
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
