import { useEffect, useRef } from 'react'
import { Card, CardType, Theme } from '../types'
import { TFn } from '../i18n'

interface Props {
  cards: Card[]
  theme: Theme
  selected: string | null
  onSelect: (id: string) => void
  t: TFn
}

interface Node {
  id: string
  label: string
  type: CardType
  x: number
  y: number
  vx: number
  vy: number
  deg: number
}

const COLORS: Record<CardType, string> = {
  concept: '#6ea8fe',
  definition: '#8b7bff',
  fact: '#4ec9a5',
  step: '#f0a35e',
  quote: '#d6a74a',
  question: '#e56d8f',
}

export function GraphView({ cards, theme, selected, onSelect, t }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<[number, number][]>([])
  const alphaRef = useRef(1)
  const rafRef = useRef(0)
  const dragRef = useRef<{ idx: number; moved: boolean } | null>(null)
  const redrawRef = useRef<(() => void) | null>(null)
  const selectedRef = useRef<string | null>(selected)
  const themeRef = useRef<Theme>(theme)

  selectedRef.current = selected
  themeRef.current = theme

  const visible = cards.filter((c) => c.status !== 'hidden')
  const signature = visible.map((c) => c.id).join(',')

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx0 = canvas.getContext('2d')
    if (!ctx0) return
    const ctx = ctx0

    let width = wrap.clientWidth || 600
    let height = wrap.clientHeight || 420

    const index = new Map<string, number>()
    const nodes: Node[] = visible.map((c, i) => {
      index.set(c.id, i)
      const a = (i / Math.max(1, visible.length)) * Math.PI * 2
      const r = Math.min(width, height) * 0.3
      return {
        id: c.id,
        label: c.title,
        type: c.type,
        x: width / 2 + Math.cos(a) * r + (Math.random() - 0.5) * 20,
        y: height / 2 + Math.sin(a) * r + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        deg: 0,
      }
    })

    const seen = new Set<string>()
    const edges: [number, number][] = []
    for (const c of visible) {
      const a = index.get(c.id)
      if (a === undefined) continue
      for (const l of c.links) {
        const b = index.get(l)
        if (b === undefined || b === a) continue
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        if (seen.has(key)) continue
        seen.add(key)
        edges.push([a, b])
        nodes[a].deg++
        nodes[b].deg++
      }
    }

    nodesRef.current = nodes
    edgesRef.current = edges
    alphaRef.current = 1

    const resize = () => {
      width = wrap.clientWidth || 600
      height = wrap.clientHeight || 420
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      alphaRef.current = Math.max(alphaRef.current, 0.4)
      kick()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    function tick() {
      const ns = nodesRef.current
      const es = edgesRef.current
      const a = alphaRef.current
      const cx = width / 2
      const cy = height / 2

      for (let i = 0; i < ns.length; i++) {
        const n = ns[i]
        n.vx += (cx - n.x) * 0.0018 * a
        n.vy += (cy - n.y) * 0.0018 * a
        for (let j = i + 1; j < ns.length; j++) {
          const m = ns[j]
          let dx = n.x - m.x
          let dy = n.y - m.y
          let d2 = dx * dx + dy * dy
          if (d2 < 1) {
            dx = Math.random() - 0.5
            dy = Math.random() - 0.5
            d2 = 1
          }
          if (d2 > 90000) continue
          const f = (2600 * a) / d2
          const d = Math.sqrt(d2)
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          n.vx += fx
          n.vy += fy
          m.vx -= fx
          m.vy -= fy
        }
      }

      for (const [i, j] of es) {
        const n = ns[i]
        const m = ns[j]
        const dx = m.x - n.x
        const dy = m.y - n.y
        const d = Math.hypot(dx, dy) || 1
        const f = (d - 118) * 0.02 * a
        const fx = (dx / d) * f
        const fy = (dy / d) * f
        n.vx += fx
        n.vy += fy
        m.vx -= fx
        m.vy -= fy
      }

      const drag = dragRef.current
      for (let i = 0; i < ns.length; i++) {
        const n = ns[i]
        if (drag && drag.idx === i) {
          n.vx = 0
          n.vy = 0
          continue
        }
        n.vx *= 0.84
        n.vy *= 0.84
        n.x += Math.max(-12, Math.min(12, n.vx))
        n.y += Math.max(-12, Math.min(12, n.vy))
        n.x = Math.max(28, Math.min(width - 28, n.x))
        n.y = Math.max(24, Math.min(height - 24, n.y))
      }

      alphaRef.current = Math.max(0, a * 0.994)
    }

    function radius(n: Node) {
      return 7 + Math.min(9, n.deg * 1.5)
    }

    function draw() {
      const dark = themeRef.current === 'dark'
      const ns = nodesRef.current
      const es = edgesRef.current
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = dark ? 'rgba(150,170,200,0.20)' : 'rgba(60,80,120,0.20)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const [i, j] of es) {
        ctx.moveTo(ns[i].x, ns[i].y)
        ctx.lineTo(ns[j].x, ns[j].y)
      }
      ctx.stroke()

      const showAll = ns.length <= 45
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const n of ns) {
        const isSel = n.id === selectedRef.current
        const r = radius(n)
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = COLORS[n.type] ?? '#6ea8fe'
        ctx.globalAlpha = isSel ? 1 : 0.9
        ctx.fill()
        ctx.globalAlpha = 1
        if (isSel) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
          ctx.strokeStyle = dark ? '#ffffff' : '#101828'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        if (showAll || isSel) {
          const label = n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label
          ctx.font = `${isSel ? '600 ' : ''}12px system-ui, sans-serif`
          ctx.fillStyle = dark ? 'rgba(226,235,248,0.9)' : 'rgba(20,28,45,0.9)'
          ctx.fillText(label, n.x, n.y + r + 5)
        }
      }
    }

    function loop() {
      if (alphaRef.current > 0.004 || dragRef.current) {
        tick()
        draw()
        rafRef.current = requestAnimationFrame(loop)
      } else {
        draw()
        rafRef.current = 0
      }
    }

    function kick() {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop)
    }

    function pos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onDown(e: PointerEvent) {
      const { x, y } = pos(e)
      const ns = nodesRef.current
      let hit = -1
      let bestD = Infinity
      for (let i = 0; i < ns.length; i++) {
        const d = Math.hypot(ns[i].x - x, ns[i].y - y)
        if (d < radius(ns[i]) + 8 && d < bestD) {
          bestD = d
          hit = i
        }
      }
      if (hit < 0) return
      dragRef.current = { idx: hit, moved: false }
      canvas!.setPointerCapture(e.pointerId)
      alphaRef.current = Math.max(alphaRef.current, 0.35)
      kick()
    }

    function onMove(e: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const { x, y } = pos(e)
      const n = nodesRef.current[drag.idx]
      if (Math.hypot(n.x - x, n.y - y) > 3) drag.moved = true
      n.x = x
      n.y = y
      alphaRef.current = Math.max(alphaRef.current, 0.3)
      kick()
    }

    function onUp(e: PointerEvent) {
      const drag = dragRef.current
      dragRef.current = null
      if (!drag) return
      try {
        canvas!.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (!drag.moved) onSelect(nodesRef.current[drag.idx].id)
      kick()
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    redrawRef.current = () => {
      alphaRef.current = Math.max(alphaRef.current, 0.02)
      kick()
    }
    kick()

    return () => {
      redrawRef.current = null
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  // Redraw on selection / theme change without restarting the simulation.
  useEffect(() => {
    redrawRef.current?.()
  }, [selected, theme])

  if (!visible.length) return <p className="empty">{t('graph.empty')}</p>

  return (
    <div className="graph">
      <div className="graph-bar">
        <span>{t('graph.nodes', { n: visible.length, e: edgesRef.current.length })}</span>
        <span className="muted">{t('graph.hint')}</span>
      </div>
      <div className="graph-canvas" ref={wrapRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
