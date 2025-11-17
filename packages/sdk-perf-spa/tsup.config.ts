import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  platform: 'node',
  outDir: 'dist',
  external: ['@wfynbzlx666/sdk-core', 'puppeteer', 'lighthouse'],
})

