import { useMemo, useState } from 'react'
import { Card, SourceDoc, Theme, UiLang } from '../types'
import { I18nKey, TFn } from '../i18n'
import { dueCards } from '../lib/srs'
import { CardItem } from './CardItem'
import { GraphView } from './GraphView'
import { ReviewPane } from './ReviewPane'

export type DeckTab = 'cards' | 'graph' | 'review'

interface Props {
  t: TFn
  lang: UiLang
  theme: Theme
  doc: SourceDoc | null
  cards: Card[]
  streaming: boolean
  tab: DeckTab
  onTab: (t: DeckTab) => void
  selected: string | null
  onSelect: (id: string | null) => void
  onUpdateCard: (id: string, p: Partial<Card>) => void
  onNotify: (m: string) => void
}

const TABS: { key: DeckTab; label: I18nKey }[] = [
  { key: 'cards', label: 'tab.cards' },
  { key: 'graph', label: 'tab.graph' },
  { key: 'review', label: 'tab.review' },
]

export function DeckPane({
  t,
  lang,
  theme,
  cards,
  streaming,
  tab,
  onTab,
  selected,
  onSelect,
  onUpdateCard,
  onNotify,
}: Props) {
  const [query, setQuery] = useState('')

  const due = useMemo(() => dueCards(cards).length, [cards])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter((c) =>
      [c.title, c.summary, c.bullets.join(' '), c.tags.join(' ')].join(' ').toLowerCase().includes(q),
    )
  }, [cards, query])

  return (
    <section className="pane deck-pane">
      <div className="pane-head">
        <div className="tabs">
          {TABS.map((x) => (
            <button
              key={x.key}
              className={tab === x.key ? 'on' : ''}
              onClick={() => onTab(x.key)}
            >
              {t(x.label)}
              {x.key === 'review' && due > 0 && <span className="pip">{due}</span>}
              {x.key === 'cards' && cards.length > 0 && <span className="count">{cards.length}</span>}
            </button>
          ))}
        </div>
        {tab === 'cards' && cards.length > 0 && (
          <input
            className="field search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('deck.search')}
          />
        )}
      </div>

      {tab === 'cards' && (
        <div className="deck">
          {filtered.length === 0 && !streaming && <p className="empty">{t('deck.empty')}</p>}
          {filtered.map((c) => (
            <CardItem
              key={c.id}
              card={c}
              t={t}
              dark={theme === 'dark'}
              selected={c.id === selected}
              onSelect={() => onSelect(c.id === selected ? null : c.id)}
              onUpdate={(p) => onUpdateCard(c.id, p)}
              onNotify={onNotify}
            />
          ))}
          {streaming && (
            <div className="card skeleton">
              <span className="shimmer" />
              <span className="shimmer w70" />
              <span className="shimmer w40" />
              <p className="loading">{t('deck.generating')}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'graph' && (
        <GraphView cards={cards} theme={theme} selected={selected} onSelect={onSelect} t={t} />
      )}

      {tab === 'review' && (
        <ReviewPane t={t} lang={lang} cards={cards} onUpdateCard={onUpdateCard} />
      )}
    </section>
  )
}
