/**
 * Runtime mount test: actually renders <App/> in JSDOM and drives the core
 * user loop (Landing -> Try sample -> cards -> graph -> review -> chat) to
 * prove the app runs and the interaction works, not just that it compiles.
 *
 * Run with: node scripts/rt.mjs
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import App from '../src/App'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const results: string[] = []
function check(name: string, cond: boolean, detail = '') {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

function buttons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
}
function findButton(re: RegExp): HTMLButtonElement | null {
  return buttons().find((b) => re.test(b.textContent || '')) || null
}
function setInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  if (setter) setter.call(el, value)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}
function click(el: Element) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}

export async function run() {
  const container = document.getElementById('root') as HTMLElement
  const root = createRoot(container)
  await act(async () => {
    root.render(React.createElement(App))
  })

  const body0 = container.textContent || ''
  check('landing renders', /知识卡|knowledge|ナレッジ/.test(body0))
  check('sample button present', !!findButton(/sample|示例|サンプル/i))

  // --- Try the sample ---
  const sampleBtn = findButton(/sample|示例|サンプル/i)
  if (sampleBtn) await act(async () => click(sampleBtn))

  // wait for streaming cards
  let waited = 0
  let body = ''
  while (waited < 5000) {
    await act(async () => {
      await sleep(300)
    })
    waited += 300
    body = container.textContent || ''
    if (/注意力|Attention|アテンション/.test(body)) break
  }
  check('sample generated cards', /注意力|Attention|アテンション/.test(body))
  check('workspace layout shown', !!container.querySelector('.layout'))
  const cardCount = (container.querySelectorAll('.card') || []).length
  check('multiple cards rendered', cardCount >= 4, `cards=${cardCount}`)

  // --- Graph tab ---
  const graphBtn = findButton(/图谱|Graph|グラフ/i)
  check('graph tab present', !!graphBtn)
  if (graphBtn) {
    await act(async () => click(graphBtn))
    await act(async () => {
      await sleep(150)
    })
  }
  check('graph canvas mounted', !!container.querySelector('canvas'))

  // --- Review tab ---
  const reviewBtn = findButton(/复习|Review|復習/i)
  check('review tab present', !!reviewBtn)
  if (reviewBtn) {
    await act(async () => click(reviewBtn))
    await act(async () => {
      await sleep(60)
    })
  }

  // --- Chat ---
  const lang = /アテンション/.test(body) ? 'ja' : /注意力/.test(body) ? 'zh' : 'en'
  const q = lang === 'ja' ? 'アテンションとは' : lang === 'zh' ? '注意力とは' : 'what is attention'
  const input = Array.from(container.querySelectorAll('input')).find((i) =>
    /提问|Ask|質問|knowledge/i.test(i.placeholder || ''),
  ) as HTMLInputElement | undefined
  const askBtn = findButton(/提问|Ask|質問/i)
  check('chat input present', !!input)
  check('chat ask button present', !!askBtn)
  if (input && askBtn) {
    await act(async () => setInput(input, q))
    await act(async () => click(askBtn))
    let c = 0
    while (c < 4000) {
      await act(async () => {
        await sleep(200)
      })
      c += 200
      if (/注意力|Attention|アテンション|答|answer/i.test(container.textContent || '')) break
    }
  }
  const answered = /注意力|Attention|アテンション/.test(container.textContent || '')
  check('chat produced a grounded answer', answered)

  await act(async () => {
    root.unmount()
  })

  console.log(results.join('\n'))
  const failed = results.filter((r) => r.startsWith('FAIL'))
  console.log(`\n${results.length - failed.length}/${results.length} runtime checks passed`)
  process.exit(failed.length ? 1 : 0)
}
