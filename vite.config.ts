import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relative paths so the build works under any sub-path (GitHub Pages, Cloudflare Pages)
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
})
