import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    open: false
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      include: [/parse/, /node_modules/],
      transformMixedEsModules: true
    }
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    dedupe: ['parse']
  },
  optimizeDeps: {
    include: ['parse'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    // Garantir que o Parse use a versão browser
    global: 'globalThis',
    'process.env': {}
  },
  ssr: {
    noExternal: ['parse']
  }
})
