import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log']
        }
      },
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          settings: resolve('src/renderer/settings.html')
        },
        output: {
          manualChunks(id) {
            // Split vendor chunks for better caching
            if (id.includes('node_modules')) {
              // React and related
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              // Radix UI components
              if (id.includes('@radix-ui')) {
                return 'radix-vendor'
              }
              // AI SDK
              if (id.includes('@ai-sdk') || id.includes('ai')) {
                return 'ai-vendor'
              }
              // Animation libraries
              if (
                id.includes('gsap') ||
                id.includes('ogl') ||
                id.includes('embla')
              ) {
                return 'animation-vendor'
              }
              // Other node_modules
              return 'vendor'
            }
            return undefined
          }
        }
      }
    }
  }
})
