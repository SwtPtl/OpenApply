import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

// Simple plugin to copy manifest into dist/
function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      mkdirSync('dist', { recursive: true })
      copyFileSync('manifest.json', 'dist/manifest.json')
      try { mkdirSync('dist/icons', { recursive: true }) } catch {}
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidebar: resolve(__dirname, 'sidebar.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.tsx'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js'
          if (chunk.name === 'content') return 'content.js'
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
