import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5500,
    open: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-dev'),
  },
})