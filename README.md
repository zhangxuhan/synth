<div align="center">

# Synth

**Turn any PDF, article or note into a deck of knowledge cards — browsable, askable, reviewable.**

100% local · no sign-up · no API key · MIT

[![CI](https://github.com/zhangxuhan/synth/actions/workflows/ci.yml/badge.svg)](https://github.com/zhangxuhan/synth/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Stars](https://img.shields.io/github/stars/zhangxuhan/synth?style=social)](https://github.com/zhangxuhan/synth)

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

**▶ Try it live:** https://zhangxuhan.github.io/synth/

<img src="docs/preview.png" alt="Synth screenshot" width="820">

</div>

---

## Why another study tool?

"Chat with your PDF" gives you a chat log. You close the tab and remember nothing.

Synth is **deck-first**, not chat-first. Your source becomes a set of structured cards you can
skim, connect, question and *actually memorise* — chat is just a side panel.

|                          | Chat-with-PDF tools | Anki | **Synth** |
| ------------------------ | :-----------------: | :--: | :-------: |
| Structured cards         |          –          |  ✅ manual  |  ✅ automatic |
| Concept graph            |          –          |  –   |    ✅     |
| Spaced repetition        |          –          |  ✅  |    ✅     |
| Grounded Q&A + citations |         ✅          |  –   |    ✅     |
| Works with no API key    |          –          |  ✅  |    ✅     |
| Data never leaves device |          –          |  ✅  |    ✅     |

## Features

- **Drop and go** — PDF, TXT, Markdown, plain text or a web page. Drag it anywhere on the window.
- **Streaming cards** — cards appear one by one with type, summary, key points, tags and a link back to the exact place in the source.
- **Concept graph** — every card links to related cards; the graph is a force-directed map you can drag and click.
- **Spaced repetition** — an SM-2 scheduler with 4 grades, interval previews and keyboard shortcuts.
- **Grounded answers** — BM25 retrieval over your own deck, every answer cites the cards it used.
- **Export everywhere** — Markdown/Obsidian, Anki-importable TSV, JSON backup, or a single card as a shareable PNG.
- **Trilingual UI** — English / 简体中文 / 日本語, switchable at any time.
- **Zero config** — the default extractor is fully offline and deterministic. Toggle Ollama on only if you want LLM-quality cards.
- **Nothing leaves your machine** — no backend, no telemetry. Everything lives in `localStorage`.

## Quick start

```bash
git clone https://github.com/zhangxuhan/synth.git
cd synth
npm install
npm run dev
```

Open http://localhost:5173 and click **Try the sample**. That is the whole onboarding.

Build a static bundle with `npm run build` — the output in `dist/` is a plain static site,
deployable to GitHub Pages, Netlify or Cloudflare Pages as-is.

### Desktop app (Windows / macOS / Linux)

Prefer a native app over a browser tab? Grab a prebuilt installer from
[GitHub Releases](https://github.com/zhangxuhan/synth/releases) — double-click and it runs
fully offline, exactly like the web app, with your data stored on your machine.

To build it yourself:

```bash
npm install
npm run tauri:dev      # dev with hot reload
npm run tauri:build    # produce installers in src-tauri/target/release/bundle/
```

### Optional: better cards with a local LLM

Synth works with no model at all. If you want richer cards, run [Ollama](https://ollama.com):

```bash
ollama pull qwen2.5:7b
OLLAMA_ORIGINS='*' ollama serve
```

Then enable **Local model** in the top bar. If Ollama is unreachable, Synth silently falls back
to the offline extractor — you never hit a dead end.

## Keyboard shortcuts

| Key            | Action                      |
| -------------- | --------------------------- |
| `Space`        | Reveal answer (review mode) |
| `1` `2` `3` `4`| Again / Hard / Good / Easy  |
| `Ctrl/⌘ + Enter` | Generate from pasted text |

## How it works

```
source ──► normalize ──► heading-aware chunking ──► TF-IDF ranking ──► cards
                                                          │
                              tag overlap ────────────────┼──► concept graph
                              SM-2 scheduler ─────────────┼──► review queue
                              BM25 retrieval ─────────────┴──► grounded Q&A
```

The offline pipeline is deterministic and dependency-free: chunk the document by headings,
score sentences with TF-IDF, pick a summary plus supporting points, derive tags, then connect
cards whose tags overlap. No embeddings, no network, no waiting.

## Tech stack

React 18 · TypeScript · Vite · pdf.js — that's it. Three runtime dependencies, ~50 KB gzipped
app bundle (pdf.js is lazy-loaded only when you import a PDF).

```
src/
  lib/        text.ts · generator.ts · search.ts · srs.ts · importers.ts · exporters.ts · store.ts
  components/ TopBar · Landing · SourcePane · DeckPane · CardItem · GraphView · ReviewPane · ChatPane
```

## Roadmap

- [ ] YouTube / audio transcripts via local Whisper
- [ ] Cloze deletion cards
- [ ] True `.apkg` export with media
- [x] Tauri desktop build (double-click install)
- [ ] Multi-document graph across your whole library

## Contributing

Issues and PRs are welcome — especially importers, language packs and card-quality heuristics.

```bash
npm run check   # typecheck + smoke tests + build
```

## License

MIT © contributors

<div align="center">

If Synth saved you an hour, a ⭐ helps other people find it.

</div>
