import { Workspace, WORKSPACE_VERSION, emptyWorkspace } from '../types'
import { ensureReview } from './srs'

const KEY = 'synth.workspace'

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function loadWorkspace(): Workspace {
  if (!hasStorage()) return emptyWorkspace()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyWorkspace()
    const parsed = JSON.parse(raw) as Partial<Workspace>
    const base = emptyWorkspace()
    const ws: Workspace = {
      ...base,
      ...parsed,
      version: WORKSPACE_VERSION,
      docs: Array.isArray(parsed.docs) ? parsed.docs : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards.map(ensureReview) : [],
    }
    // Drop cards whose source no longer exists.
    const ids = new Set(ws.docs.map((d) => d.id))
    ws.cards = ws.cards.filter((c) => ids.has(c.sourceId))
    if (ws.activeDocId && !ids.has(ws.activeDocId)) {
      ws.activeDocId = ws.docs.length ? ws.docs[ws.docs.length - 1].id : null
    }
    return ws
  } catch {
    return emptyWorkspace()
  }
}

let timer: ReturnType<typeof setTimeout> | null = null

export function saveWorkspace(ws: Workspace): void {
  if (!hasStorage()) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ws))
    } catch (e) {
      console.warn('[synth] failed to persist workspace', e)
    }
  }, 250)
}

export function clearWorkspace(): void {
  if (!hasStorage()) return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
