import { Card } from '../types'
import { TFn } from '../i18n'
import { cardToPng, download, slugify } from '../lib/exporters'

interface Props {
  card: Card
  t: TFn
  dark: boolean
  selected: boolean
  onSelect: () => void
  onUpdate: (p: Partial<Card>) => void
  onNotify: (m: string) => void
}

export function CardItem({ card, t, dark, selected, onSelect, onUpdate, onNotify }: Props) {
  const starred = card.status === 'starred'
  const hidden = card.status === 'hidden'

  async function savePng(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const blob = await cardToPng(card, { dark })
      download(`${slugify(card.title)}.png`, blob, 'image/png')
    } catch (err) {
      onNotify(t('msg.importFailed', { e: err instanceof Error ? err.message : String(err) }))
    }
  }

  return (
    <article
      className={`card type-${card.type} ${selected ? 'selected' : ''} ${hidden ? 'is-hidden' : ''}`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="card-head">
        <span className={`badge b-${card.type}`}>{card.type}</span>
        <h3>{card.title}</h3>
        <div className="card-tools" onClick={(e) => e.stopPropagation()}>
          <button
            className={`tool ${starred ? 'on' : ''}`}
            title={starred ? t('deck.unstar') : t('deck.star')}
            onClick={() => onUpdate({ status: starred ? 'auto' : 'starred' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
            </svg>
          </button>
          <button className="tool" title={t('deck.png')} onClick={savePng}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5h16v14H4V5zm2 10l3.2-3.6 2.3 2.6 3-3.8L18 17H6v-2z" />
            </svg>
          </button>
          <button
            className="tool"
            title={hidden ? t('deck.unhide') : t('deck.hide')}
            onClick={() => onUpdate({ status: hidden ? 'auto' : 'hidden' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7zm0 3a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </button>
        </div>
      </div>

      {card.summary && <p className="summary">{card.summary}</p>}

      {card.bullets.length > 0 && (
        <ul>
          {card.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      {card.tags.length > 0 && (
        <div className="card-foot">
          {card.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
