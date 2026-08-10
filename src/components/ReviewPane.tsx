import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, UiLang } from '../types'
import { TFn } from '../i18n'
import { Grade, dueCards, formatInterval, previewIntervals, schedule } from '../lib/srs'

interface Props {
  t: TFn
  lang: UiLang
  cards: Card[]
  onUpdateCard: (id: string, p: Partial<Card>) => void
}

const GRADE_KEYS = ['review.again', 'review.hard', 'review.good', 'review.easy'] as const

export function ReviewPane({ t, lang, cards, onUpdateCard }: Props) {
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  const signature = cards.map((c) => c.id).join(',')

  const [queue, setQueue] = useState<string[]>(() => dueCards(cards).map((c) => c.id))
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    setQueue(dueCards(cards).map((c) => c.id))
    setIdx(0)
    setShow(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const currentId = queue[idx]
  const card = currentId ? byId.get(currentId) : undefined

  const grade = useCallback(
    (g: Grade) => {
      if (!card) return
      onUpdateCard(card.id, { review: schedule(card.review, g) })
      if (g === 0) setQueue((q) => [...q, card.id])
      setIdx((i) => i + 1)
      setShow(false)
    },
    [card, onUpdateCard],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /INPUT|TEXTAREA/.test(target.tagName)) return
      if (!card) return
      if (!show && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        setShow(true)
        return
      }
      if (show && e.key >= '1' && e.key <= '4') {
        e.preventDefault()
        grade((Number(e.key) - 1) as Grade)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, show, grade])

  const restart = () => {
    setQueue(dueCards(cards).map((c) => c.id))
    setIdx(0)
    setShow(false)
  }

  if (!cards.length) return <p className="empty">{t('deck.empty')}</p>

  if (!card) {
    const nextDue = cards
      .map((c) => c.review?.due ?? 0)
      .filter((d) => d > Date.now())
      .sort((a, b) => a - b)[0]
    return (
      <div className="review done">
        <p className="done-title">{t('review.allDone')}</p>
        {nextDue && (
          <p className="muted">
            {new Date(nextDue).toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US')}
          </p>
        )}
        <button className="ghost" onClick={restart}>
          {t('review.start', { n: dueCards(cards).length })}
        </button>
      </div>
    )
  }

  const previews = previewIntervals(card.review)
  const remaining = queue.length - idx

  return (
    <div className="review">
      <div className="review-bar">
        <div className="progress">
          <span style={{ width: `${(idx / Math.max(1, queue.length)) * 100}%` }} />
        </div>
        <span className="muted">{t('review.left', { n: remaining })}</span>
      </div>

      <div className={`flash ${show ? 'flipped' : ''}`} onClick={() => !show && setShow(true)}>
        <span className={`badge b-${card.type}`}>{card.type}</span>
        <h3>{card.title}</h3>
        {show && (
          <div className="flash-back">
            <p>{card.summary}</p>
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
          </div>
        )}
      </div>

      {show ? (
        <div className="grades">
          {previews.map((p, i) => (
            <button key={p.grade} className={`grade g${i}`} onClick={() => grade(p.grade)}>
              <strong>{t(GRADE_KEYS[i])}</strong>
              <em>{formatInterval(p.days, lang)}</em>
              <kbd>{i + 1}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <button className="primary big wide" onClick={() => setShow(true)}>
          {t('review.show')} <kbd>space</kbd>
        </button>
      )}
    </div>
  )
}
