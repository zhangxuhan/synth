import { useEffect, useRef, useState } from 'react'
import { Card, ChatTurn } from '../types'
import { TFn } from '../i18n'

interface Props {
  t: TFn
  turns: ChatTurn[]
  cards: Card[]
  onAsk: (q: string) => void | Promise<void>
  onJump: (id: string) => void
}

export function ChatPane({ t, turns, cards, onAsk, onJump }: Props) {
  const [q, setQ] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns])

  function submit() {
    const v = q.trim()
    if (!v) return
    setQ('')
    void onAsk(v)
  }

  return (
    <section className="pane chat-pane">
      <div className="pane-head">
        <h2>{t('pane.chat')}</h2>
      </div>

      <div className="chat-log" ref={logRef}>
        {turns.length === 0 && <p className="empty">{t('chat.empty')}</p>}
        {turns.map((turn) => (
          <div key={turn.id} className="turn">
            <p className="q">{turn.q}</p>
            <div className="answer">
              {turn.pending ? <span className="muted">{t('chat.thinking')}</span> : turn.a}
            </div>
            {turn.citations.length > 0 && (
              <div className="cites">
                <span className="muted">{t('chat.sources')}:</span>
                {turn.citations.map((id, i) => {
                  const c = cards.find((x) => x.id === id)
                  if (!c) return null
                  return (
                    <button key={id} className="cite" onClick={() => onJump(id)} title={c.title}>
                      [{i + 1}] {c.title.length > 18 ? `${c.title.slice(0, 17)}…` : c.title}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('chat.placeholder')}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="primary" onClick={submit} disabled={!q.trim()}>
          {t('chat.ask')}
        </button>
      </div>
    </section>
  )
}
