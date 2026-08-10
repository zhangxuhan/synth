import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, SourceDoc, Workspace, ChatTurn, uid } from './types'
import { makeT } from './i18n'
import { loadWorkspace, saveWorkspace, clearWorkspace } from './lib/store'
import { generateCards } from './lib/generator'
import { answerOffline, answerOllama } from './lib/search'
import { importFile, importUrl, makeDoc } from './lib/importers'
import { sampleText, SAMPLE_TITLES } from './lib/sample'
import { TopBar } from './components/TopBar'
import { Landing } from './components/Landing'
import { SourcePane } from './components/SourcePane'
import { DeckPane, DeckTab } from './components/DeckPane'
import { ChatPane } from './components/ChatPane'
import { Toast } from './components/Toast'

export default function App() {
  const [ws, setWs] = useState<Workspace>(() => loadWorkspace())
  const [streaming, setStreaming] = useState(false)
  const [tab, setTab] = useState<DeckTab>('cards')
  const [selected, setSelected] = useState<string | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [toast, setToast] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const genId = useRef(0)

  const t = useMemo(() => makeT(ws.lang), [ws.lang])

  useEffect(() => saveWorkspace(ws), [ws])
  useEffect(() => {
    document.documentElement.dataset.theme = ws.theme
    document.documentElement.lang = ws.lang
  }, [ws.theme, ws.lang])

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3200)
  }, [])

  const patch = useCallback((p: Partial<Workspace>) => setWs((w) => ({ ...w, ...p })), [])

  const activeDoc = useMemo(
    () => ws.docs.find((d) => d.id === ws.activeDocId) ?? null,
    [ws.docs, ws.activeDocId],
  )
  const activeCards = useMemo(
    () => (ws.activeDocId ? ws.cards.filter((c) => c.sourceId === ws.activeDocId) : ws.cards),
    [ws.cards, ws.activeDocId],
  )

  /* ---------------- generation ---------------- */

  const runGeneration = useCallback(
    async (doc: SourceDoc) => {
      const run = ++genId.current
      setStreaming(true)
      setTab('cards')
      setSelected(null)
      let fellBack = false
      try {
        const batch: Card[] = []
        for await (const card of generateCards(doc, {
          useOllama: ws.useOllama,
          model: ws.model,
          onFallback: () => {
            fellBack = true
          },
        })) {
          if (genId.current !== run) return
          batch.push(card)
          setWs((w) => ({ ...w, cards: [...w.cards.filter((c) => c.sourceId !== doc.id), ...batch] }))
        }
        if (fellBack) notify(t('msg.ollamaFailed'))
        if (!batch.length) notify(t('msg.emptyText'))
      } catch (e) {
        notify(t('msg.importFailed', { e: e instanceof Error ? e.message : String(e) }))
      } finally {
        if (genId.current === run) setStreaming(false)
      }
    },
    [ws.useOllama, ws.model, notify, t],
  )

  const addDoc = useCallback(
    (doc: SourceDoc) => {
      if (!doc.text.trim()) {
        notify(t('msg.emptyText'))
        return
      }
      setWs((w) => ({ ...w, docs: [...w.docs, doc], activeDocId: doc.id }))
      setTurns([])
      void runGeneration(doc)
    },
    [runGeneration, notify, t],
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = [...files]
      if (!list.length) return
      notify(t('msg.parsing'))
      for (const f of list) {
        try {
          const { doc, pages } = await importFile(f, () => undefined)
          if (pages) notify(t('msg.pdfPages', { n: pages }))
          addDoc(doc)
        } catch (e) {
          notify(t('msg.importFailed', { e: e instanceof Error ? e.message : String(e) }))
        }
      }
    },
    [addDoc, notify, t],
  )

  const handleUrl = useCallback(
    async (url: string, useProxy: boolean) => {
      notify(t('msg.parsing'))
      try {
        const { doc } = await importUrl(url, { useProxy })
        addDoc(doc)
      } catch {
        notify(t('msg.urlFailed'))
      }
    },
    [addDoc, notify, t],
  )

  const handleText = useCallback(
    (text: string, title?: string) => addDoc(makeDoc(title || 'Note', text, 'text')),
    [addDoc],
  )

  const handleSample = useCallback(() => {
    addDoc(makeDoc(SAMPLE_TITLES[ws.lang], sampleText(ws.lang), 'sample'))
  }, [addDoc, ws.lang])

  /* ---------------- global drag & drop ---------------- */

  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false)
    }
    const drop = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [handleFiles])

  /* ---------------- cards ---------------- */

  const updateCard = useCallback((id: string, p: Partial<Card>) => {
    setWs((w) => ({ ...w, cards: w.cards.map((c) => (c.id === id ? { ...c, ...p } : c)) }))
  }, [])

  const reset = useCallback(() => {
    if (!window.confirm(t('top.resetConfirm'))) return
    genId.current++
    clearWorkspace()
    setStreaming(false)
    setTurns([])
    setSelected(null)
    setWs((w) => ({ ...w, docs: [], cards: [], activeDocId: null }))
  }, [t])

  /* ---------------- chat ---------------- */

  const ask = useCallback(
    async (q: string) => {
      const id = uid()
      setTurns((ts) => [...ts, { id, q, a: '', citations: [], pending: true }])
      let res = { text: '', citations: [] as string[] }
      try {
        res = ws.useOllama
          ? await answerOllama(q, activeCards, ws.model)
          : answerOffline(q, activeCards)
      } catch {
        res = answerOffline(q, activeCards)
      }
      const text = res.text || t('chat.noAnswer')
      setTurns((ts) =>
        ts.map((x) => (x.id === id ? { ...x, a: text, citations: res.citations, pending: false } : x)),
      )
    },
    [activeCards, ws.useOllama, ws.model, t],
  )

  const showLanding = ws.docs.length === 0

  return (
    <div className="app">
      <TopBar
        ws={ws}
        t={t}
        onPatch={patch}
        onReset={reset}
        onAddFiles={handleFiles}
        onSample={handleSample}
        compact={showLanding}
      />

      {showLanding ? (
        <Landing
          t={t}
          onText={handleText}
          onFiles={handleFiles}
          onUrl={handleUrl}
          onSample={handleSample}
        />
      ) : (
        <main className="layout">
          <SourcePane
            t={t}
            docs={ws.docs}
            activeId={ws.activeDocId}
            selectedCard={ws.cards.find((c) => c.id === selected) ?? null}
            onSelectDoc={(id) => {
              patch({ activeDocId: id })
              setSelected(null)
              setTurns([])
            }}
          />
          <DeckPane
            t={t}
            lang={ws.lang}
            theme={ws.theme}
            doc={activeDoc}
            cards={activeCards}
            streaming={streaming}
            tab={tab}
            onTab={setTab}
            selected={selected}
            onSelect={setSelected}
            onUpdateCard={updateCard}
            onNotify={notify}
          />
          <ChatPane t={t} turns={turns} cards={activeCards} onAsk={ask} onJump={setSelected} />
        </main>
      )}

      {dragging && <div className="drop-overlay">{t('landing.drop')}</div>}
      <Toast message={toast} />
    </div>
  )
}
