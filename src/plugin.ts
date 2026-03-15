import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { Plugin, ResolvedConfig } from 'vite'

import type { Options } from './types'
import {
  buildSitemapEntries,
  generateSitemap,
  getErrorMsg,
  LOGGER_CLEAR,
  LOGGER_PREFIX,
  LOGGER_SUCCESS,
  logColor,
  logStart,
  logSuccess,
} from './utils'

const BASE_PATH = '/'
const FILE_NAME = 'sitemap.xml'
const SITEMAP_PATH = `${BASE_PATH}${FILE_NAME}`

export function sitemap(options: Options): Plugin {
  let config: ResolvedConfig
  const enabled = options.enabled ?? true
  const host = options.hostname ?? undefined
  const routes = options.routes?.length ? options.routes : ['/']
  const customOutDir = options.outDir ?? undefined

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

      if (customOutDir) {
        config.logger.info(
          `${LOGGER_CLEAR}- ${LOGGER_PREFIX} Custom outDir: ${logColor('green', customOutDir)} (will be used during build)`,
        )
      }
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

      const entries = buildSitemapEntries({ hostname: host, routes })
      const content = generateSitemap(entries)

      if (customOutDir) {
        try {
          const normalisedOutDir = customOutDir.replace(/^\/+/, '')
          const resolvedOutDir = resolve(config.root, normalisedOutDir)
          const filePath = join(resolvedOutDir, FILE_NAME)

          logStart(config, filePath)

          mkdirSync(resolvedOutDir, { recursive: true })
          writeFileSync(filePath, content, 'utf-8')

          logSuccess(config)
        } catch (err) {
          throw new Error(getErrorMsg(err))
        }

        return
      }

      try {
        const normalisedOutDir = config.build.outDir.endsWith('/server')
          ? config.build.outDir.replace(/\/server$/, '/client')
          : config.build.outDir
        const resolvedOutDir = resolve(config.root, normalisedOutDir)
        const filePath = join(resolvedOutDir, FILE_NAME)

        logStart(config, filePath)

        writeFileSync(filePath, content, 'utf-8')

        logSuccess(config)
      } catch (err) {
        throw new Error(getErrorMsg(err))
      }
    },
  }
}
