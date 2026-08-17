import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Electron main process entry point.
        // vite-plugin-electron bundles this with esbuild → dist-electron/main.js
        entry: 'electron/main.js',
      },
      preload: {
        // Preload script runs in a renderer context with Node access.
        // Pin the output to preload.js (not .mjs) so main.js can reference it
        // with the same filename in both dev and production.
        input: 'electron/preload.js',
        vite: {
          build: {
            rollupOptions: {
              output: {
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
      // renderer: enables Node.js built-in modules in the renderer (not needed here
      // since all Node access goes through the contextBridge IPC bridge).
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
})
