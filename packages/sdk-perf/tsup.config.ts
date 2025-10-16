import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  // 将 Node.js 专用依赖标记为 external，不打包进最终产物
  external: [
    'puppeteer',
    'lighthouse',
    'fs',
    'fs/promises',
    'path',
    'url',
    '@wfynbzlx666/sdk-core'
  ],
  // 不将依赖打包，保持为外部依赖
  noExternal: [],
})