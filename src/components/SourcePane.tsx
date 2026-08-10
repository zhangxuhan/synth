import { useEffect, useRef } from 'react'
import { Card, SourceDoc } from '../types'
import { TFn } from '../i18n'

interface Props {
  t: TFn
  docs: SourceDoc[]
  activeId: string | null
  selectedCard: Card | null
  onSelectDoc: (id: string) => void
}

const KIND_LABEL: Record<string, string> = {
  pdf: 'PDF',
  url: 'WEB',
  text: 'TXT',
  file: 'FILE',
  sample: 'DEMO',
}

export function SourcePane({ t, docs, activeId, selectedCard, onSelectDoc }: Props) {
  const markRef = useRef<HTMLElement>(null)
  const doc = docs.find((d) => d.id === activeId) ?? null

  useEffect(() => {
    markRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedCard?.id])

  const span =
    selectedCard && doc && selectedCard.sourceId === doc.id && selectedCard.sourceSpan.end > selectedCard.sourceSpan.start
      ? selectedCard.sourceSpan
      : null

  const text = doc?.text ?? ''
  const pre = span ? text.slice(0, span.start) : text
  const mid = span ? text.slice(span.start, Math.min(span.end, text.length)) : ''
  const post = span ? text.slice(Math.min(span.end, text.length)) : ''

  return (
    <section className="pane source-pane">
      <div className="pane-head">
        <h2>{t('pane.source')}</h2>
        {doc && <span className="count">{t('source.chars', { n: doc.text.length })}</span>}
      </div>

      {docs.length > 1 && (
        <div className="chips">
          {docs.map((d) => (
            <button
              key={d.id}
              className={`chip ${d.id === activeId ? 'on' : ''}`}
              onClick={() => onSelectDoc(d.id)}
              title={d.title}
            >
              <span className="chip-kind">{KIND_LABEL[d.kind] ?? 'DOC'}</span>
              {d.title}
            </button>
          ))}
        </div>
      )}

      {doc ? (
        <div className="source-text">
          {span ? (
            <>
              {pre}
              <mark ref={markRef}>{mid}</mark>
              {post}
            </>
          ) : (
            text
          )}
        </div>
      ) : (
        <p className="empty">{t('source.empty')}</p>
      )}
    </section>
  )
}
