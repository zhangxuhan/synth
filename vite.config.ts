import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Relative base so the built assets also work when served from a sub-path
  // (e.g. GitHub Pages at https://user.github.io/synth/).
  base: './',
  build: {
    // Keep the output dir as-is instead of emptying it. On some sandboxed
    // Windows environments fs.rmSync is intercepted and the build aborts
    // while trying to trash dist/assets. Stale hashed assets are never
    // referenced by index.html, and dist is gitignored.
    emptyOutDir: false,
  },
})
