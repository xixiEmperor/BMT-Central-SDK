import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 文件名为 vite.libconfig.ts，防止与 vite.config.ts 冲突
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'lib',
    lib: {
      entry: 'src/index.ts',
      name: 'perfBoard',
      fileName: (format) => `index.${format}.js`
    },
  }
})
