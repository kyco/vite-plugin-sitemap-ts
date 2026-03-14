import fs from 'node:fs'
import path from 'node:path'

import type { Plugin, ResolvedConfig } from 'vite'

import type { Options } from './types'
import {
  buildSitemapEntries,
  generateSitemap,
  LOGGER_CLEAR,
  LOGGER_FAILURE,
  LOGGER_PREFIX,
  LOGGER_SUCCESS,
  logColor,
} from './utils'

const BASE_PATH = '/'
const FILE_NAME = 'sitemap.xml'
const SITEMAP_PATH = `${BASE_PATH}${FILE_NAME}`

export function sitemap(options: Options): Plugin {
  let config: ResolvedConfig
  let success = false

  const enabled = options.enabled ?? true
  const host = options.hostname ?? undefined
  const routes = options.routes ?? ['/']

  if (!host) {
    throw new Error('Sitemap hostname is not set and required to build the sitemap.')
  }

  return {
    name: 'vite-plugin-sitemap-ts',

    apply: () => enabled,

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    configureServer(server) {
      server.middlewares.use(SITEMAP_PATH, (_req, res) => {
        const entries = buildSitemapEntries({ hostname: host, routes })
        const content = generateSitemap(entries)

        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        res.end(content)
      })

      config.logger.info(
        `${LOGGER_CLEAR}${LOGGER_SUCCESS} ${LOGGER_PREFIX} Exposed new route: ${logColor('green', SITEMAP_PATH)}`,
      )
    },

    closeBundle() {
      /**
       * Environment API only available since Vite v6, hence the conditional checking around it.
       * We only want to create the sitemap.xml on the client and only when running a build.
       */
      if (this.environment) {
        if (this.environment.name !== 'client' || this.environment.mode === 'dev') {
          return
        }
      }

      const outDir = config.build.outDir.replace('server', 'client') // TODO: Bit of a hack, at the minute don't know how to get the client build outDir.
      config.logger.info(`\n- ${LOGGER_CLEAR}${LOGGER_PREFIX} Writing sitemap.xml at ${outDir}${SITEMAP_PATH}`)

      try {
        const entries = buildSitemapEntries({ hostname: host, routes })
        const content = generateSitemap(entries)
        const outDirPath = path.resolve(config.root, outDir)
        const filePath = path.join(outDirPath, FILE_NAME)

        fs.writeFileSync(filePath, content, 'utf-8')

        success = true
      } catch (_err) {
        success = false
      }

      config.logger.info(
        `${LOGGER_CLEAR}${success ? LOGGER_SUCCESS : LOGGER_FAILURE} ${LOGGER_PREFIX} ${success ? `Success` : `Failed writing sitemap.xml!`}`,
      )
    },
  }
}
