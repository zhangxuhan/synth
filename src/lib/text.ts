/**
 * Pure text utilities: tokenization (CJK aware), sentence splitting,
 * heading-aware chunking and TF-IDF scoring.
 * No DOM, no network -> trivially unit-testable.
 */

export const STOP = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'with', 'that', 'this', 'these',
  'those', 'it', 'its', 'as', 'by', 'from', 'at', 'we', 'our', 'you', 'your',
  'they', 'their', 'he', 'she', 'his', 'her', 'can', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'not', 'no', 'but', 'if', 'then', 'than',
  'so', 'such', 'into', 'over', 'more', 'most', 'other', 'some', 'any', 'each',
  'which', 'who', 'what', 'when', 'where', 'how', 'why', 'all', 'also', 'have',
  'has', 'had', 'do', 'does', 'did', 'about', 'there', 'here', 'one', 'two',
  // Chinese
  '的', '了', '和', '是', '在', '我', '你', '他', '她', '它', '我们', '你们',
  '他们', '一个', '这种', '这个', '那个', '可以', '通过', '作为', '以及',
  '对于', '这些', '那些', '因为', '所以', '或者', '之后', '已经', '这样',
  '那样', '一种', '不是', '就是', '如果', '但是', '而且', '需要', '进行',
  '例如', '比如', '什么', '怎么', '为了', '被', '与', '及', '等等', '一般',
  '通常', '非常', '更加', '同时', '然后', '还是', '只是', '并且', '其中',
  // Japanese
  'これ', 'それ', 'あれ', 'この', 'その', 'あの', 'ここ', 'そこ', 'ため',
  'よう', 'こと', 'もの', 'など', 'ます', 'です', 'した', 'する', 'ある',
  'いる', 'なる', 'れる', 'られ', 'から', 'まで', 'より', 'および', 'また',
  'しかし', 'そして', 'つまり', 'ただし',
])

export interface Line {
  text: string
  start: number
}

export function toLines(text: string): Line[] {
  const lines: Line[] = []
  let pos = 0
  for (const raw of text.split('\n')) {
    lines.push({ text: raw, start: pos })
    pos += raw.length + 1
  }
  return lines
}

const SEGMENTER: { seg: { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> } | null } = {
  seg: null,
}

function getSegmenter() {
  if (SEGMENTER.seg) return SEGMENTER.seg
  const Ctor = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => never }).Segmenter
  if (!Ctor) return null
  try {
    SEGMENTER.seg = new (Ctor as unknown as new (
      l?: string,
      o?: object,
    ) => { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> })(undefined, {
      granularity: 'word',
    })
    return SEGMENTER.seg
  } catch {
    return null
  }
}

const CJK = /[\u4e00-\u9fa5\u3040-\u30ff]/

/** Tokenize latin + CJK. Uses Intl.Segmenter when available, bigrams otherwise. */
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const out: string[] = []
  const seg = getSegmenter()
  if (seg) {
    try {
      for (const piece of seg.segment(lower)) {
        if (piece.isWordLike === false) continue
        const w = piece.segment.trim()
        if (w.length < 2) continue
        if (STOP.has(w)) continue
        if (/^\d+$/.test(w)) continue
        out.push(w)
      }
      if (out.length) return out
    } catch {
      /* fall through */
    }
  }
  for (const w of lower.match(/[a-z][a-z0-9'-]{1,}/g) || []) {
    if (!STOP.has(w)) out.push(w)
  }
  for (const run of lower.match(/[\u4e00-\u9fa5\u3040-\u30ff]{2,}/g) || []) {
    for (let i = 0; i < run.length - 1; i++) {
      const bi = run.slice(i, i + 2)
      if (!STOP.has(bi)) out.push(bi)
    }
  }
  return out
}

export function splitSentences(text: string): string[] {
  const parts = text.split(
    /(?<=[。！？!?；;])\s*|(?<=\.)\s+(?=["'(\[]?[A-Z0-9])|\n+/g,
  )
  return parts.map((s) => s.trim()).filter((s) => s.length > 1)
}

export function isCJK(text: string): boolean {
  return CJK.test(text)
}

export interface Chunk {
  heading: string | null
  text: string
  start: number
}

const HEADING_MD = /^#{1,6}\s+(.{1,80})$/
const HEADING_NUM = /^(\d+(?:\.\d+)*)[\.、)\s]\s*(.{1,60})$/
const LIST_ITEM = /^\s*(?:[-*•·]|\d+[.)、])\s+/

function looksLikeHeading(line: string, next: string | undefined): string | null {
  const t = line.trim()
  if (!t) return null
  const md = HEADING_MD.exec(t)
  if (md) return md[1].trim()
  if (LIST_ITEM.test(t)) return null
  const num = HEADING_NUM.exec(t)
  if (num && num[2].length >= 2 && !/[。．.]$/.test(num[2])) return num[2].trim()
  const short = t.length <= (isCJK(t) ? 30 : 60)
  const noEnd = !/[。！？!?,，、;；:：]$/.test(t)
  const hasNext = !!next && next.trim().length > 0
  if (short && noEnd && hasNext && t.split(/\s+/).length <= 12) {
    // A short standalone line followed by prose is very likely a heading.
    return t.replace(/^[#\s]+/, '')
  }
  return null
}

/**
 * Heading-aware chunking. Falls back to paragraph packing when the document
 * has no structure at all.
 */
export function splitChunks(text: string, maxChunks = 60): Chunk[] {
  const lines = toLines(text)
  const minLen = isCJK(text) ? 90 : 220
  const maxLen = isCJK(text) ? 700 : 1600

  const chunks: Chunk[] = []
  let cur: { heading: string | null; buf: string[]; start: number } | null = null

  const flush = () => {
    if (!cur) return
    const body = cur.buf.join('\n').trim()
    if (body.length > 0) {
      chunks.push({ heading: cur.heading, text: body, start: cur.start })
    }
    cur = null
  }

  for (let i = 0; i < lines.length; i++) {
    const { text: raw, start } = lines[i]
    const trimmed = raw.trim()
    const next = lines[i + 1]?.text
    const heading = looksLikeHeading(raw, next)

    if (heading) {
      flush()
      cur = { heading, buf: [], start: start + raw.length + 1 }
      continue
    }
    if (!trimmed) {
      if (cur && cur.buf.join('\n').trim().length >= minLen) flush()
      continue
    }
    if (!cur) cur = { heading: null, buf: [], start }
    cur.buf.push(trimmed)
    if (cur.buf.join('\n').length >= maxLen) flush()
  }
  flush()

  // Merge chunks that are too small to be meaningful.
  const merged: Chunk[] = []
  for (const c of chunks) {
    const prev = merged[merged.length - 1]
    if (prev && prev.text.length < minLen && prev.text.length + c.text.length <= maxLen) {
      prev.text = `${prev.text}\n${c.text}`
      if (!prev.heading) prev.heading = c.heading
    } else {
      merged.push({ ...c })
    }
  }

  // Hard cap so a 500-page PDF does not explode into 5000 cards.
  if (merged.length > maxChunks) {
    const groupSize = Math.ceil(merged.length / maxChunks)
    const capped: Chunk[] = []
    for (let i = 0; i < merged.length; i += groupSize) {
      const group = merged.slice(i, i + groupSize)
      capped.push({
        heading: group.find((g) => g.heading)?.heading ?? null,
        text: group.map((g) => g.text).join('\n'),
        start: group[0].start,
      })
    }
    return capped
  }
  return merged.length ? merged : text.trim() ? [{ heading: null, text: text.trim(), start: 0 }] : []
}

export interface Tfidf {
  idf: Map<string, number>
  docs: Map<string, number>[]
}

export function buildTfidf(docsTokens: string[][]): Tfidf {
  const df = new Map<string, number>()
  const docs = docsTokens.map((tokens) => {
    const tf = new Map<string, number>()
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
    for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1)
    return tf
  })
  const N = Math.max(1, docsTokens.length)
  const idf = new Map<string, number>()
  for (const [t, d] of df) idf.set(t, Math.log(1 + N / d))
  return { idf, docs }
}

export function topTerms(tf: Map<string, number>, idf: Map<string, number>, k: number): string[] {
  const scored = [...tf.entries()]
    .map(([t, f]) => [t, f * (idf.get(t) ?? 1)] as const)
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])

  // Drop terms that are substrings of a higher-ranked term (CJK bigram noise).
  const picked: string[] = []
  for (const t of scored) {
    if (picked.length >= k) break
    if (picked.some((p) => p.includes(t) || t.includes(p))) continue
    picked.push(t)
  }
  return picked
}

export function truncate(s: string, n: number): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`
}
