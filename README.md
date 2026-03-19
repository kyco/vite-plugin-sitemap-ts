# vite-plugin-sitemap-ts

A Vite plugin to generate `sitemap.xml`. Works in development mode by proxying middleware to `/sitemap.xml`.

> [!IMPORTANT]
> This plugin requires you to manually define `routes`. It does not automatically scan your build!

## Installation

```bash
npm install -D vite-plugin-sitemap-ts
pnpm add -D vite-plugin-sitemap-ts
yarn add -D vite-plugin-sitemap-ts
bun add -D vite-plugin-sitemap-ts
deno add -D npm:vite-plugin-sitemap-ts
```

## Usage

```ts
// vite.config.ts
import { sitemap } from 'vite-plugin-sitemap-ts'

export default {
  plugins: [
    sitemap({
      hostname: 'https://example.com',
      routes: ['/', '/about'],
    }),
  ],
}
```
## Examples

### Without routes:

The plugin will generate a root route ("/") when the `routes` option is omitted.

```ts
sitemap({
  hostname: 'https://example.com',
})
```

*Output:*
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-14</lastmod>
  </url>
</urlset>
```

### With routes:

The plugin will generate only those routes which have been defined by the `routes` option.

```ts
sitemap({
  hostname: 'https://example.com',
  routes: ['/about'],
})
```

*Output:*
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2026-03-14</lastmod>
  </url>
</urlset>
```

### With route objects:

Route objects (aka. `SitemapEntry` objects) allow for full control over "loc", "lastmod", "changefreq", "priority" and "hreflang".

```ts
sitemap({
  hostname: 'https://example.com',
  routes: [
    '/',
    '/about',
    {
      loc: '/blog',
      lastmod: '2026-01-01',
      changefreq: 'weekly',
      priority: 0.8
    },
  ],
})
```

*Output:*
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-14</lastmod>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2026-03-14</lastmod>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### With hreflang (i18n support):

Use the `hreflang` property on a `SitemapEntry` to define alternate language versions of a page.

```ts
sitemap({
  hostname: 'https://example.com',
  routes: [
    {
      loc: '/about',
      hreflang: [
        { lang: 'en', loc: '/about' },
        { lang: 'de', loc: '/de/ueber' },
        { lang: 'x-default', loc: '/about' },
      ],
    },
  ],
})
```

*Output:*
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2026-03-14</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/about" />
    <xhtml:link rel="alternate" hreflang="de" href="https://example.com/de/ueber" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/about" />
  </url>
</urlset>
```

### With dynamic routes:

Since Vite configs support async, you can fetch routes dynamically and pass them to the plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { sitemap } from 'vite-plugin-sitemap-ts'

export default defineConfig(async () => {
  const routes = await fetchRoutesFromCMS()

  return {
    plugins: [
      sitemap({
        hostname: 'https://example.com',
        routes,
      }),
    ],
  }
})
```

## Options

The `hostname` option is required. All other options are optional.

| Option   | Type                                              | Default | Description                                                                   |
|----------|---------------------------------------------------|---------|-------------------------------------------------------------------------------|
| hostname | *string*                                          | -       | The hostname of the site, used to build the full URLs in the sitemap          |
| enabled  | *boolean*                                         | `true`  | Toggle the plugin on or off                                                   |
| routes   | *(string \| [SitemapEntry](./src/types.ts#L8))[]* | `['/']` | An array of routes to include in the sitemap                                  |
| outDir   | *string*                                          | -       | Custom output directory for `sitemap.xml` (resolved relative to project root) |
