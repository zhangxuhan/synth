import { Card, UiLang } from '../types'
import { detectLang } from '../i18n'
import { buildTfidf, tokenize } from './text'

export interface Hit {
  card: Card
  score: number
}

/** BM25-lite retrieval over the card deck. Fully local, no embeddings needed. */
export function retrieve(query: string, cards: Card[], k = 4): Hit[] {
  const usable = cards.filter((c) => c.status !== 'hidden')
  if (!usable.length) return []
  const docsTokens = usable.map((c) =>
    tokenize([c.title, c.summary, c.bullets.join(' '), c.tags.join(' ')].join(' ')),
  )
  const { idf, docs } = buildTfidf(docsTokens)
  const avgLen = docsTokens.reduce((a, t) => a + t.length, 0) / docsTokens.length || 1
  const qTokens = [...new Set(tokenize(query))]
  if (!qTokens.length) return []

  const k1 = 1.4
  const b = 0.72
  const hits: Hit[] = usable.map((card, i) => {
    const tf = docs[i]
    const len = docsTokens[i].length || 1
    let score = 0
    for (const t of qTokens) {
      const f = tf.get(t) ?? 0
      if (!f) continue
      const w = idf.get(t) ?? 1
      score += (w * f * (k1 + 1)) / (f + k1 * (1 - b + (b * len) / avgLen))
    }
    // Title matches are worth more than body matches.
    const title = card.title.toLowerCase()
    for (const t of qTokens) if (title.includes(t)) score += 1.2
    if (card.status === 'starred') score *= 1.05
    return { card, score }
  })

  return hits
    .filter((h) => h.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, k)
}

const LEAD: Record<UiLang, string> = {
  zh: '根据这份资料，相关要点如下：',
  en: 'Based on this source, here are the relevant points:',
  ja: 'この資料によると、関連する要点は次のとおりです：',
}

export interface Answer {
  text: string
  citations: string[]
}

export function answerOffline(query: string, cards: Card[]): Answer {
  const hits = retrieve(query, cards, 3)
  if (!hits.length) return { text: '', citations: [] }
  const lang = detectLang(`${query} ${hits[0].card.summary}`)
  const body = hits
    .map((h, i) => {
      const extra = h.card.bullets[0] ? `\n   ${h.card.bullets[0]}` : ''
      return `${i + 1}. ${h.card.title} — ${h.card.summary}${extra}`
    })
    .join('\n')
  return { text: `${LEAD[lang]}\n${body}`, citations: hits.map((h) => h.card.id) }
}

export async function answerOllama(
  query: string,
  cards: Card[],
  model: string,
  endpoint = 'http://localhost:11434',
): Promise<Answer> {
  const hits = retrieve(query, cards, 5)
  if (!hits.length) return { text: '', citations: [] }
  const context = hits
    .map((h, i) => `[${i + 1}] ${h.card.title}: ${h.card.summary} ${h.card.bullets.join(' ')}`)
    .join('\n')
  const prompt =
    'Answer the question using ONLY the context. Cite sources like [1]. ' +
    'If the context is insufficient, say so. Answer in the language of the question.\n\n' +
    `CONTEXT:\n${context}\n\nQUESTION: ${query}`
  const res = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.2 } }),
  })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
  const data = (await res.json()) as { response?: string }
  return { text: (data.response || '').trim(), citations: hits.map((h) => h.card.id) }
}
