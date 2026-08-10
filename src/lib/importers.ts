import { SourceDoc, SourceKind, uid } from '../types'

export interface ImportResult {
  doc: SourceDoc
  pages?: number
}

export function makeDoc(title: string, text: string, kind: SourceKind): SourceDoc {
  return {
    id: uid(),
    title: title.trim() || 'Untitled',
    text: normalize(text),
    kind,
    createdAt: Date.now(),
  }
}

/** Collapse pdf artefacts: hyphen line-breaks, triple newlines, nbsp. */
export function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/([A-Za-z])-\n([a-z])/g, '$1$2')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const TEXT_EXT = /\.(txt|md|markdown|csv|json|log|srt|vtt|rst|tex)$/i

export async function importFile(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<ImportResult> {
  const name = file.name.replace(/\.[^.]+$/, '')
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    const { text, pages } = await extractPdf(file, onProgress)
    return { doc: makeDoc(name, text, 'pdf'), pages }
  }
  if (TEXT_EXT.test(file.name) || file.type.startsWith('text/') || file.type === '') {
    const text = await file.text()
    return { doc: makeDoc(name, text, 'file') }
  }
  throw new Error(`Unsupported file type: ${file.name}`)
}

/** Lazy-loaded so pdf.js (~1MB) never blocks first paint. */
export async function extractPdf(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<{ text: string; pages: number }> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
  const out: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.(`${p}/${pdf.numPages}`)
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    let line = ''
    const lines: string[] = []
    for (const item of content.items) {
      const it = item as { str?: string; hasEOL?: boolean }
      if (typeof it.str !== 'string') continue
      line += it.str
      if (it.hasEOL) {
        lines.push(line.trim())
        line = ''
      }
    }
    if (line.trim()) lines.push(line.trim())
    out.push(lines.join('\n'))
  }
  await pdf.destroy()
  return { text: out.join('\n\n'), pages: pdf.numPages }
}

/** Strip tags from fetched HTML with a readability-ish heuristic. */
export function htmlToText(html: string): { title: string; text: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,nav,footer,header,aside,noscript,svg,form').forEach((n) =>
    n.remove(),
  )
  const title = doc.querySelector('title')?.textContent?.trim() || 'Web page'
  const candidates = [...doc.querySelectorAll('article, main, .content, #content, body')]
  let best: Element | null = null
  let bestLen = 0
  for (const el of candidates) {
    const len = (el.textContent || '').length
    if (len > bestLen) {
      bestLen = len
      best = el
    }
  }
  const root = best || doc.body
  const parts: string[] = []
  root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre').forEach((el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
    if (!t) return
    if (/^H[1-4]$/.test(el.tagName)) parts.push(`\n## ${t}\n`)
    else if (el.tagName === 'LI') parts.push(`- ${t}`)
    else parts.push(t)
  })
  const text = parts.join('\n\n')
  return { title, text: text.length > 200 ? text : (root.textContent || '').trim() }
}

export interface UrlOptions {
  /** Explicit opt-in: routes the request through a public reader proxy. */
  useProxy?: boolean
}

export async function importUrl(url: string, opts: UrlOptions = {}): Promise<ImportResult> {
  const target = opts.useProxy ? `https://r.jina.ai/${url}` : url
  const res = await fetch(target, { headers: { Accept: 'text/html,text/plain' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.text()
  if (opts.useProxy) {
    const firstLine = body.split('\n').find((l) => l.startsWith('Title:'))
    const title = firstLine ? firstLine.replace('Title:', '').trim() : hostOf(url)
    return { doc: makeDoc(title, body, 'url') }
  }
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(body.slice(0, 500))
  const { title, text } = looksHtml ? htmlToText(body) : { title: hostOf(url), text: body }
  return { doc: makeDoc(title, text, 'url') }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.slice(0, 40)
  }
}
