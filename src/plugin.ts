import type { Plugin, ResolvedConfig } from 'vite'

import type { Options } from './types'
import { LOGGER_CLEAR, LOGGER_FAILURE, LOGGER_PREFIX, LOGGER_SUCCESS, logColor, SITEMAP_CONTENT } from './utils'

const BASE_PATH = '/'
const FILE_NAME = 'sitemap.xml'
const SITEMAP_PATH = `${BASE_PATH}${FILE_NAME}`

export function sitemap(options: Options = {}): Plugin {
  let config: ResolvedConfig
  let success = false
  const sitemapContent = SITEMAP_CONTENT

  const enabled = options.enabled ?? true

  return {
    name: 'vite-plugin-sitemap-ts',

    apply: () => enabled,

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    configureServer(server) {
      server.middlewares.use(SITEMAP_PATH, (_req, res) => {
        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        res.end(sitemapContent)
      })

      config.logger.info(
        `${LOGGER_CLEAR}${LOGGER_SUCCESS} ${LOGGER_PREFIX} Exposed new route: ${logColor('green', SITEMAP_PATH)}`,
      )
    },

    generateBundle() {
      /**
       * Environment API only available since Vite v6, hence the conditional checking around it.
       * We only want to emit the sitemap.xml on the client.
       */
      if (this.environment?.name && this.environment.name !== 'client') {
        return
      }

      config.logger.info(
        `\n- ${LOGGER_CLEAR}${LOGGER_PREFIX} Writing sitemap.xml at ${config.build.outDir}${SITEMAP_PATH}`,
      )

      try {
        this.emitFile({
          type: 'asset',
          fileName: FILE_NAME,
          source: sitemapContent,
        })
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
