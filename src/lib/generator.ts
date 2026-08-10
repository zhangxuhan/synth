import { Card, CardType, SourceDoc, newReviewState, uid } from '../types'
import {
  Chunk,
  buildTfidf,
  splitChunks,
  splitSentences,
  tokenize,
  topTerms,
  truncate,
} from './text'

export interface GenOptions {
  useOllama?: boolean
  model?: string
  endpoint?: string
  /** Called when Ollama fails and we silently fall back to offline mode. */
  onFallback?: (reason: string) => void
  /** Delay between yielded cards (ms). 0 in tests. */
  delay?: number
}

const DEF_PATTERNS: RegExp[] = [
  /^[「『"']?(.{2,30}?)[」』"']?\s*(?:是指|指的是|是一种|是一个|定义为|就是指|即为)/,
  /^(.{2,40}?)\s*(?:とは|というのは)/,
  /^(.{2,40}?)\s+(?:is|are)\s+(?:a|an|the)\s+/i,
  /^(.{2,40}?)\s*(?:refers to|is defined as|means)\b/i,
]

const STEP_HINTS = /步骤|首先|第一步|接下来|然后|最后|手順|まず|次に|\bstep\s*\d|\bfirst\b.*\bthen\b/i
const QUESTION_HINTS = /[?？]\s*$|^为什么|^如何|^怎样|^なぜ|^どう|^why\b|^how\b|^what\b/i
const FACT_HINTS = /\d+(?:\.\d+)?\s*%|\b(?:19|20)\d{2}\b|\d+\s*(?:倍|万|亿|billion|million|人|件)|\$\s?\d/
const QUOTE_HINTS = /^[>＞]|^[「『"“]/

function inferType(chunk: Chunk, sentences: string[]): CardType {
  const text = chunk.text
  const first = sentences[0] || ''
  if (QUOTE_HINTS.test(text.trim())) return 'quote'
  if (QUESTION_HINTS.test(chunk.heading || first)) return 'question'
  // A definition may sit in the second sentence if a short title line precedes it.
  for (const s of sentences.slice(0, 2)) {
    if (DEF_PATTERNS.some((p) => p.test(s))) return 'definition'
  }
  const listItems = (text.match(/^\s*(?:[-*•·]|\d+[.)、])\s+/gm) || []).length
  if (listItems >= 2 || STEP_HINTS.test(text)) return 'step'
  if (FACT_HINTS.test(text)) return 'fact'
  return 'concept'
}

function definitionSubject(sentence: string): string | null {
  for (const p of DEF_PATTERNS) {
    const m = p.exec(sentence.trim())
    if (m && m[1]) {
      const s = m[1].trim().replace(/^[「『"'“]/, '')
      if (s.length >= 2 && s.length <= 40) return s
    }
  }
  return null
}

function scoreSentence(
  sentence: string,
  idf: Map<string, number>,
  tf: Map<string, number>,
): number {
  const toks = tokenize(sentence)
  if (!toks.length) return 0
  let sum = 0
  for (const t of toks) sum += (tf.get(t) ?? 0) * (idf.get(t) ?? 1)
  // Length normalisation: prefer informative but not endless sentences.
  const penalty = 1 + Math.abs(sentence.length - 90) / 260
  return sum / (Math.sqrt(toks.length) * penalty)
}

/** Deterministic, offline card extraction. This is the zero-config default. */
export function analyze(doc: SourceDoc): Card[] {
  const chunks = splitChunks(doc.text)
  if (!chunks.length) return []

  const chunkTokens = chunks.map((c) => tokenize(`${c.heading ?? ''} ${c.text}`))
  const { idf, docs } = buildTfidf(chunkTokens)

  const usedTitles = new Set<string>()
  const cards: Card[] = chunks.map((chunk, i) => {
    const tf = docs[i]
    const sentences = splitSentences(chunk.text)
    const ranked = sentences
      .map((s, idx) => ({ s, idx, score: scoreSentence(s, idf, tf) }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]?.s ?? chunk.text
    const summary = truncate(best, 180)
    const bullets = ranked
      .slice(0, 4)
      .filter((r) => r.s !== best)
      .slice(0, 3)
      .sort((a, b) => a.idx - b.idx)
      .map((r) => truncate(r.s, 120))

    const tags = topTerms(tf, idf, 4)
    const type = inferType(chunk, sentences)

    let title =
      chunk.heading?.trim() ||
      definitionSubject(sentences[0] || '') ||
      truncate(sentences[0] || chunk.text, 42)
    title = title.replace(/^[#>＞\-*•·\s]+/, '').trim() || `#${i + 1}`
    if (usedTitles.has(title)) title = `${title} (${i + 1})`
    usedTitles.add(title)

    return {
      id: uid(),
      sourceId: doc.id,
      type,
      title,
      summary,
      bullets,
      tags,
      links: [],
      sourceSpan: { start: chunk.start, end: chunk.start + chunk.text.length },
      status: 'auto',
      review: newReviewState(),
    }
  })

  return linkCards(cards)
}

/** Build concept-graph edges from tag overlap, guaranteeing connectivity. */
export function linkCards(cards: Card[]): Card[] {
  const sets = cards.map((c) => new Set(c.tags))
  const links: string[][] = cards.map(() => [])

  for (let i = 0; i < cards.length; i++) {
    const scored: { j: number; score: number }[] = []
    for (let j = 0; j < cards.length; j++) {
      if (i === j) continue
      let inter = 0
      for (const t of sets[i]) if (sets[j].has(t)) inter++
      if (!inter) continue
      const union = sets[i].size + sets[j].size - inter
      scored.push({ j, score: union ? inter / union : 0 })
    }
    scored.sort((a, b) => b.score - a.score)
    for (const { j } of scored.slice(0, 3)) links[i].push(cards[j].id)
  }

  // Keep the graph connected: chain isolated nodes to their neighbour.
  for (let i = 0; i < cards.length; i++) {
    if (links[i].length === 0) {
      const neighbour = cards[i + 1] ?? cards[i - 1]
      if (neighbour) links[i].push(neighbour.id)
    }
  }
  return cards.map((c, i) => ({ ...c, links: [...new Set(links[i])] }))
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function* generateCardsOffline(
  doc: SourceDoc,
  delay = 110,
): AsyncGenerator<Card> {
  const cards = analyze(doc)
  const step = cards.length > 20 ? Math.max(15, delay / 3) : delay
  for (const c of cards) {
    yield c
    if (step > 0) await sleep(step)
  }
}

const OLLAMA_SYSTEM =
  'You extract study cards from documents. Reply with JSON only. ' +
  'Always answer in the same language as the source text.'

function ollamaPrompt(text: string): string {
  return (
    'Extract 2-5 study cards from the text below.\n' +
    'Return JSON: {"cards":[{"type":"concept|definition|fact|step|quote|question",' +
    '"title":"short noun phrase","summary":"1-2 sentences",' +
    '"bullets":["key point",...],"tags":["keyword",...]}]}\n' +
    'Rules: no invented facts, keep the source language, titles under 40 characters.\n\n' +
    `TEXT:\n"""${text}"""`
  )
}

async function* generateCardsOllama(
  doc: SourceDoc,
  model: string,
  endpoint: string,
): AsyncGenerator<Card> {
  const chunks = splitChunks(doc.text, 24)
  // Batch chunks so each request has enough context but stays fast.
  const batches: Chunk[][] = []
  let cur: Chunk[] = []
  let size = 0
  for (const c of chunks) {
    cur.push(c)
    size += c.text.length
    if (size > 2200) {
      batches.push(cur)
      cur = []
      size = 0
    }
  }
  if (cur.length) batches.push(cur)

  for (const batch of batches) {
    const text = batch.map((b) => (b.heading ? `## ${b.heading}\n${b.text}` : b.text)).join('\n\n')
    const res = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: OLLAMA_SYSTEM,
        prompt: ollamaPrompt(text.slice(0, 6000)),
        stream: false,
        format: 'json',
        options: { temperature: 0.2 },
      }),
    })
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = (await res.json()) as { response?: string }
    const parsed = JSON.parse(data.response || '{}') as
      | { cards?: unknown[] }
      | unknown[]
    const list: unknown[] = Array.isArray(parsed) ? parsed : (parsed.cards ?? [])
    for (const raw of list) {
      const c = raw as Partial<Card>
      if (!c || typeof c !== 'object') continue
      const title = String(c.title ?? '').trim()
      if (!title) continue
      yield {
        id: uid(),
        sourceId: doc.id,
        type: (['concept', 'definition', 'fact', 'step', 'quote', 'question'] as CardType[]).includes(
          c.type as CardType,
        )
          ? (c.type as CardType)
          : 'concept',
        title: truncate(title, 60),
        summary: truncate(String(c.summary ?? ''), 220),
        bullets: Array.isArray(c.bullets)
          ? c.bullets.slice(0, 4).map((b) => truncate(String(b), 140))
          : [],
        tags: Array.isArray(c.tags) ? c.tags.slice(0, 4).map((t) => String(t)) : [],
        links: [],
        sourceSpan: { start: batch[0].start, end: batch[0].start + text.length },
        status: 'auto',
        review: newReviewState(),
      }
    }
  }
}

export async function* generateCards(
  doc: SourceDoc,
  opts: GenOptions = {},
): AsyncGenerator<Card> {
  if (opts.useOllama) {
    const endpoint = opts.endpoint || 'http://localhost:11434'
    const collected: Card[] = []
    try {
      for await (const c of generateCardsOllama(doc, opts.model || 'qwen2.5:7b', endpoint)) {
        collected.push(c)
        yield c
      }
      if (collected.length) return
      opts.onFallback?.('empty')
    } catch (e) {
      if (collected.length) return // partial success, keep what we got
      opts.onFallback?.(e instanceof Error ? e.message : String(e))
    }
  }
  yield* generateCardsOffline(doc, opts.delay ?? 110)
}

export async function pingOllama(endpoint = 'http://localhost:11434'): Promise<string[]> {
  const res = await fetch(`${endpoint}/api/tags`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { models?: { name: string }[] }
  return (data.models || []).map((m) => m.name)
}
