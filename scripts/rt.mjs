/**
 * Runner: bundle the React harness with esbuild, set up a JSDOM DOM with the
 * browser-ish globals the app touches (canvas/ResizeObserver/RAF/localStorage),
 * then execute the interaction loop. Plain JS (run directly by node).
 */
import { JSDOM } from 'jsdom'
import { build } from 'esbuild'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '.rt.bundle.mjs')

await build({
  entryPoints: [path.join(__dirname, 'rt.test.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  jsx: 'automatic',
  logLevel: 'error',
  define: { 'process.env.NODE_ENV': '"development"' },
})

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})
const { window } = dom

const g = globalThis
g.window = window
g.document = window.document
g.HTMLElement = window.HTMLElement
g.HTMLCanvasElement = window.HTMLCanvasElement
g.HTMLInputElement = window.HTMLInputElement
g.Event = window.Event
g.MouseEvent = window.MouseEvent
g.Node = window.Node
g.getComputedStyle = window.getComputedStyle.bind(window)
g.IS_REACT_ACT_ENVIRONMENT = true

window.devicePixelRatio = 1
window.requestAnimationFrame = ((cb) => setTimeout(() => cb(Date.now()), 16))
window.cancelAnimationFrame = ((id) => clearTimeout(id))
g.requestAnimationFrame = window.requestAnimationFrame
g.cancelAnimationFrame = window.cancelAnimationFrame

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = RO
g.ResizeObserver = RO

const ctxStub = new Proxy({}, { get: () => () => undefined, set: () => true })
window.HTMLCanvasElement.prototype.getContext = () => ctxStub

// jsdom doesn't implement scrolling APIs that real browsers have.
window.HTMLElement.prototype.scrollTo = function () {}
window.HTMLElement.prototype.scrollIntoView = function () {}
window.Element.prototype.scrollTo = function () {}
window.Element.prototype.scrollIntoView = function () {}

if (!('localStorage' in window)) {
  const store = new Map()
  const ls = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
  g.localStorage = ls
  window.localStorage = ls
} else {
  g.localStorage = window.localStorage
}

const mod = await import(pathToFileURL(out).href)
await mod.run()
