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
    <lastmod>2026-03-14T19:27:44.429Z</lastmod>
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
    <lastmod>2026-03-14T19:42:17.729Z</lastmod>
  </url>
</urlset>
```

## Options

The `hostname` option is required. All other options are optional.

| Option   | Type       | Default | Description                                                          |
|----------|------------|---------|----------------------------------------------------------------------|
| hostname | *string*   | -       | The hostname of the site, used to build the full URLs in the sitemap |
| enabled  | *boolean*  | `true`  | Toggle the plugin on or off                                          |
| routes   | *string[]* | `['/']` | An array of routes to include in the sitemap                         |

