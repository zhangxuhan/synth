export type CardType =
  | 'concept'
  | 'definition'
  | 'fact'
  | 'step'
  | 'quote'
  | 'question'

export type UiLang = 'zh' | 'en' | 'ja'

export type Theme = 'dark' | 'light'

export interface SourceSpan {
  start: number
  end: number
  page?: number
}

/** SM-2 spaced repetition state. */
export interface ReviewState {
  reps: number
  lapses: number
  /** Ease factor, SM-2 default 2.5. */
  ease: number
  /** Current interval in days. */
  interval: number
  /** Due timestamp (ms). 0 = new card, due immediately. */
  due: number
}

export interface Card {
  id: string
  sourceId: string
  type: CardType
  title: string
  summary: string
  bullets: string[]
  tags: string[]
  /** ids of related cards -> concept graph edges */
  links: string[]
  sourceSpan: SourceSpan
  status: 'auto' | 'edited' | 'starred' | 'hidden'
  review: ReviewState
}

export type SourceKind = 'text' | 'pdf' | 'file' | 'url' | 'sample'

export interface SourceDoc {
  id: string
  title: string
  text: string
  kind: SourceKind
  createdAt: number
}

export interface ChatTurn {
  id: string
  q: string
  a: string
  citations: string[]
  pending?: boolean
}

export interface Workspace {
  version: number
  docs: SourceDoc[]
  cards: Card[]
  activeDocId: string | null
  lang: UiLang
  theme: Theme
  useOllama: boolean
  model: string
}

export const WORKSPACE_VERSION = 2

export function emptyWorkspace(): Workspace {
  return {
    version: WORKSPACE_VERSION,
    docs: [],
    cards: [],
    activeDocId: null,
    lang: 'zh',
    theme: 'dark',
    useOllama: false,
    model: 'qwen2.5:7b',
  }
}

export function newReviewState(): ReviewState {
  return { reps: 0, lapses: 0, ease: 2.5, interval: 0, due: 0 }
}

export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  )
}
