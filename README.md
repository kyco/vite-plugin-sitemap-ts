# vite-plugin-sitemap-ts

A Vite plugin to generate `sitemap.xml`. Works in development mode by proxying middleware to `/sitemap.xml`.

> [!WARNING]
> **DO NOT USE IN PRODUCTION!** This plugin is actively being devloped.

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
    sitemap(),
  ],
}
```

## Options

All options are optional.

| Option  | Type                               | Default | Description                                                                  |
|---------|------------------------------------|---------|------------------------------------------------------------------------------|
| enabled | *boolean*                          | `true`  | Toggle the plugin on or off                                                  |

