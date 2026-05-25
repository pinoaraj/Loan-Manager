import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const appVersion = packageJson.version
const buildStamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_APP_BUILD_STAMP': JSON.stringify(buildStamp),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  }
})
