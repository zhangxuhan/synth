import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = join(root, 'node_modules', '.cache')
const outFile = join(outDir, 'synth-smoke.mjs')

mkdirSync(outDir, { recursive: true })

await build({
  entryPoints: [join(here, 'smoke.test.ts')],
  bundle: true,
  outfile: outFile,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  logLevel: 'error',
})

await import(pathToFileURL(outFile).href)
