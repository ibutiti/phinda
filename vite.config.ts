import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import ts from 'typescript'
import { defineConfig } from 'vite'

const wranglerConfigPath = fileURLToPath(new URL('./wrangler.jsonc', import.meta.url))
const parsedWranglerConfig = ts.parseConfigFileTextToJson(
  wranglerConfigPath,
  readFileSync(wranglerConfigPath, 'utf8'),
)

if (parsedWranglerConfig.error) {
  throw new Error(ts.flattenDiagnosticMessageText(parsedWranglerConfig.error.messageText, '\n'))
}

const clerkPublishableKey = parsedWranglerConfig.config.vars?.VITE_CLERK_PUBLISHABLE_KEY

const config = defineConfig({
  define: clerkPublishableKey
    ? { 'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey) }
    : undefined,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
