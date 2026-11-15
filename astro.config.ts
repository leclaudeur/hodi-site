import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

// Static pages only: nginx serves dist/ as plain files and sends /api/ on to Hodi (nginx.conf).
export default defineConfig({
  site: 'https://get-hodi.com',
  // /legal is legal.html: no trailing slash, no redirect.
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  integrations: [sitemap({ filter: page => !page.endsWith('/404') })]
})
