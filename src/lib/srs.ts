import { Card, ReviewState, newReviewState } from '../types'

export const DAY = 24 * 60 * 60 * 1000

/** 0 = Again, 1 = Hard, 2 = Good, 3 = Easy */
export type Grade = 0 | 1 | 2 | 3

/**
 * SM-2 variant with 4 grades, the same shape Anki/SuperMemo users expect.
 * Pure function: takes a state, returns the next state. Easy to unit test.
 */
export function schedule(
  state: ReviewState,
  grade: Grade,
  now: number = Date.now(),
): ReviewState {
  const s: ReviewState = { ...state }

  if (grade === 0) {
    s.lapses += 1
    s.reps = 0
    s.ease = Math.max(1.3, s.ease - 0.2)
    s.interval = 0
    s.due = now + 10 * 60 * 1000 // relearn in 10 minutes
    return s
  }

  s.reps += 1
  if (grade === 1) s.ease = Math.max(1.3, s.ease - 0.15)
  if (grade === 3) s.ease = Math.min(3.0, s.ease + 0.15)

  if (s.reps === 1) {
    s.interval = grade === 1 ? 1 : grade === 3 ? 3 : 1
  } else if (s.reps === 2) {
    s.interval = grade === 1 ? 3 : grade === 3 ? 8 : 6
  } else {
    const mult = grade === 1 ? 1.2 : grade === 3 ? s.ease * 1.3 : s.ease
    s.interval = Math.max(1, Math.round(s.interval * mult))
  }
  s.interval = Math.min(s.interval, 365)
  s.due = now + s.interval * DAY
  return s
}

export function isDue(card: Card, now: number = Date.now()): boolean {
  if (card.status === 'hidden') return false
  return (card.review?.due ?? 0) <= now
}

export function dueCards(cards: Card[], now: number = Date.now()): Card[] {
  return cards.filter((c) => isDue(c, now))
}

export function ensureReview(card: Card): Card {
  if (card.review && typeof card.review.due === 'number') return card
  return { ...card, review: newReviewState() }
}

export function formatInterval(days: number, lang: 'zh' | 'en' | 'ja'): string {
  if (days < 1) return lang === 'en' ? '10m' : lang === 'ja' ? '10分' : '10分钟'
  if (days < 30) return lang === 'en' ? `${days}d` : `${days}${lang === 'ja' ? '日' : '天'}`
  const m = Math.round(days / 30)
  return lang === 'en' ? `${m}mo` : `${m}${lang === 'ja' ? 'ヶ月' : '个月'}`
}

/** Preview the next interval for each button, for the review UI. */
export function previewIntervals(state: ReviewState, now = Date.now()) {
  const grades: Grade[] = [0, 1, 2, 3]
  return grades.map((g) => {
    const next = schedule(state, g, now)
    return { grade: g, days: next.interval }
  })
}
