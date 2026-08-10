import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// pdf.js v4 uses Promise.withResolvers (Chrome 119+, Safari 17.4+, FF 121+).
// Tiny polyfill so older browsers can still import PDFs.
type Resolvers<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}
const P = Promise as unknown as { withResolvers?: <T>() => Resolvers<T> }
if (typeof P.withResolvers !== 'function') {
  P.withResolvers = function withResolvers<T>(): Resolvers<T> {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
