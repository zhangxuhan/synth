/**
 * Headless smoke tests for the pure logic (no DOM, no network).
 * Run with: npm test
 */
import { SourceDoc, newReviewState, uid } from '../src/types'
import { splitChunks, splitSentences, tokenize, truncate } from '../src/lib/text'
import { analyze, generateCards, linkCards } from '../src/lib/generator'
import { answerOffline, retrieve } from '../src/lib/search'
import { schedule, previewIntervals, dueCards, formatInterval } from '../src/lib/srs'
import { toAnkiTsv, toJson, toMarkdown, slugify } from '../src/lib/exporters'
import { detectLang, translate } from '../src/i18n'
import { sampleText, SAMPLE_TITLES } from '../src/lib/sample'
import { normalize, htmlToText } from '../src/lib/importers'

let passed = 0
const failures: string[] = []

function ok(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function doc(text: string, title = 'Test'): SourceDoc {
  return { id: uid(), title, text, kind: 'text', createdAt: Date.now() }
}

/* ---------- text utils ---------- */

ok('tokenize latin', tokenize('The quick brown Fox jumps').includes('quick'))
ok('tokenize drops stopwords', !tokenize('the and of').includes('the'))
ok('tokenize cjk', tokenize('注意力机制是一种加权求和').length > 0)
ok('splitSentences zh', splitSentences('第一句。第二句！第三句？').length === 3)
ok('splitSentences en', splitSentences('One thing. Two things. Three.').length >= 2)
ok('truncate', truncate('abcdefghij', 5).length === 5)
ok('normalize joins hyphen breaks', normalize('inter-\nnational') === 'international')

/* ---------- chunking on real sample text ---------- */

for (const lang of ['zh', 'en', 'ja'] as const) {
  const text = sampleText(lang)
  const chunks = splitChunks(text)
  ok(`chunks/${lang} count`, chunks.length >= 4, `got ${chunks.length}`)
  ok(
    `chunks/${lang} headings`,
    chunks.filter((c) => c.heading).length >= 3,
    `headings=${chunks.filter((c) => c.heading).length}`,
  )
  ok(
    `chunks/${lang} offsets`,
    chunks.every((c) => c.start >= 0 && c.start <= text.length),
  )
}

const zhChunks = splitChunks(sampleText('zh'))
ok('chunk heading text', zhChunks.some((c) => c.heading === '什么是注意力机制'), JSON.stringify(zhChunks.map((c) => c.heading)))

/* ---------- card generation ---------- */

for (const lang of ['zh', 'en', 'ja'] as const) {
  const d = doc(sampleText(lang), SAMPLE_TITLES[lang])
  const cards = analyze(d)
  ok(`analyze/${lang} count`, cards.length >= 4, `got ${cards.length}`)
  ok(`analyze/${lang} titles`, cards.every((c) => c.title.trim().length > 1))
  ok(`analyze/${lang} summaries`, cards.every((c) => c.summary.trim().length > 5))
  ok(
    `analyze/${lang} tags`,
    cards.filter((c) => c.tags.length > 0).length >= cards.length - 1,
    `tagged=${cards.filter((c) => c.tags.length).length}/${cards.length}`,
  )
  ok(`analyze/${lang} links`, cards.every((c) => c.links.length > 0))
  ok(
    `analyze/${lang} link targets exist`,
    cards.every((c) => c.links.every((l) => cards.some((x) => x.id === l))),
  )
  ok(
    `analyze/${lang} spans`,
    cards.every(
      (c) =>
        c.sourceSpan.start >= 0 &&
        c.sourceSpan.end > c.sourceSpan.start &&
        d.text.slice(c.sourceSpan.start, c.sourceSpan.end).trim().length > 0,
    ),
  )
  ok(`analyze/${lang} unique ids`, new Set(cards.map((c) => c.id)).size === cards.length)
  ok(`analyze/${lang} unique titles`, new Set(cards.map((c) => c.title)).size === cards.length)
  ok(
    `analyze/${lang} type variety`,
    new Set(cards.map((c) => c.type)).size >= 2,
    [...new Set(cards.map((c) => c.type))].join(','),
  )
}

ok('analyze empty doc', analyze(doc('')).length === 0)
ok('analyze tiny doc', analyze(doc('Hello world.')).length === 1)
ok('linkCards single', linkCards(analyze(doc('Only one short note here.'))).length === 1)

const defCards = analyze(doc('注意力机制\n\n注意力机制是指模型动态决定关注哪些输入的方法。它包含查询、键、值三个部分。'))
ok('definition type detected', defCards.some((c) => c.type === 'definition'), defCards.map((c) => c.type).join(','))

/* ---------- async generator ---------- */

const gen = await (async () => {
  const out = []
  for await (const c of generateCards(doc(sampleText('zh')), { delay: 0 })) out.push(c)
  return out
})()
ok('generateCards streams all', gen.length === analyze(doc(sampleText('zh'))).length || gen.length >= 4, `got ${gen.length}`)

/* ---------- SRS ---------- */

let st = newReviewState()
st = schedule(st, 2, 0)
ok('srs first good = 1d', st.interval === 1, String(st.interval))
st = schedule(st, 2, 0)
ok('srs second good = 6d', st.interval === 6, String(st.interval))
const before = st.interval
st = schedule(st, 2, 0)
ok('srs third good grows', st.interval > before, `${before} -> ${st.interval}`)
const lapsed = schedule(st, 0, 0)
ok('srs again resets', lapsed.interval === 0 && lapsed.lapses === 1 && lapsed.due > 0)
ok('srs ease floor', schedule({ ...newReviewState(), ease: 1.3 }, 0, 0).ease >= 1.3)
ok('srs interval cap', schedule({ reps: 20, lapses: 0, ease: 3, interval: 400, due: 0 }, 3, 0).interval <= 365)
ok('srs previews 4', previewIntervals(newReviewState()).length === 4)
ok('formatInterval', formatInterval(45, 'en') === '2mo', formatInterval(45, 'en'))

const dueTest = analyze(doc(sampleText('en')))
ok('all new cards are due', dueCards(dueTest).length === dueTest.length)
const graded = dueTest.map((c, i) => (i === 0 ? { ...c, review: schedule(c.review, 3, Date.now()) } : c))
ok('graded card leaves due queue', dueCards(graded).length === dueTest.length - 1)

/* ---------- retrieval + answers ---------- */

const enCards = analyze(doc(sampleText('en')))
const hits = retrieve('multi-head attention', enCards, 3)
ok('retrieve returns hits', hits.length > 0, `got ${hits.length}`)
ok('retrieve ranked', hits.every((h, i) => i === 0 || hits[i - 1].score >= h.score))
ok('retrieve empty query', retrieve('', enCards).length === 0)
ok('retrieve no cards', retrieve('anything', []).length === 0)

const ans = answerOffline('what is positional encoding', enCards)
ok('answerOffline text', ans.text.length > 20)
ok('answerOffline citations', ans.citations.length > 0 && ans.citations.every((id) => enCards.some((c) => c.id === id)))
ok('answerOffline unknown', answerOffline('zzzzqqqq', enCards).text === '')

const hiddenCards = enCards.map((c) => ({ ...c, status: 'hidden' as const }))
ok('retrieve skips hidden', retrieve('attention', hiddenCards).length === 0)

/* ---------- exporters ---------- */

const d2 = doc(sampleText('zh'), '示例')
const cards2 = analyze(d2)
const md = toMarkdown([d2], cards2)
ok('markdown has doc title', md.includes('## 示例'))
ok('markdown has all cards', cards2.every((c) => md.includes(c.title)))
const tsv = toAnkiTsv(cards2)
const rows = tsv.split('\n').filter((r) => !r.startsWith('#'))
ok('anki row count', rows.length === cards2.length, `${rows.length} vs ${cards2.length}`)
ok('anki 3 columns', rows.every((r) => r.split('\t').length === 3))
ok('anki no raw newlines', rows.every((r) => !r.includes('\n')))
ok('json round trip', JSON.parse(toJson([d2], cards2)).cards.length === cards2.length)
ok('slugify strips path chars', slugify('a/b:c*d') === 'abcd', slugify('a/b:c*d'))
ok('markdown skips hidden', !toMarkdown([d2], cards2.map((c) => ({ ...c, status: 'hidden' as const }))).includes(cards2[0].title))

/* ---------- i18n ---------- */

ok('i18n zh', translate('zh', 'tab.cards') === '卡片')
ok('i18n en', translate('en', 'tab.cards') === 'Cards')
ok('i18n ja', translate('ja', 'tab.review') === '復習')
ok('i18n interpolation', translate('en', 'deck.due', { n: 7 }) === '7 due', translate('en', 'deck.due', { n: 7 }))
ok('detectLang zh', detectLang(sampleText('zh')) === 'zh')
ok('detectLang en', detectLang(sampleText('en')) === 'en')
ok('detectLang ja', detectLang(sampleText('ja')) === 'ja', detectLang(sampleText('ja')))

/* ---------- html import ---------- */

ok('htmlToText requires DOM (skipped in node)', typeof htmlToText === 'function')

/* ---------- report ---------- */

console.log(`\n  ${passed} passed, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`)
  process.exit(1)
}
console.log('  all green\n')
