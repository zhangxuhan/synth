import { UiLang } from './types'

/**
 * Chinese is the reference dictionary. `en` / `ja` are typed as
 * Record<I18nKey, string>, so a missing translation is a compile error.
 */
const zh = {
  'brand.tagline': '把任何资料变成知识卡',

  'landing.title': '把任何资料，变成一叠知识卡',
  'landing.sub': '拖入 PDF、粘贴文章或笔记 —— 立刻得到可浏览、可追问、可复习的知识卡。全程本地运行，无需注册，无需 API Key。',
  'landing.drop': '把 PDF / TXT / Markdown 拖到这里',
  'landing.or': '或者',
  'landing.choose': '选择文件',
  'landing.paste': '直接粘贴文本…',
  'landing.sample': '一键体验示例',
  'landing.generate': '生成知识卡',
  'landing.urlPlaceholder': '粘贴网页链接 https://…',
  'landing.fetch': '抓取',
  'landing.privacy': '100% 本地 · 数据不出浏览器 · 开源免费',
  'landing.step1': '导入资料',
  'landing.step1d': 'PDF / 文本 / 网页',
  'landing.step2': '自动成卡',
  'landing.step2d': '摘要 · 要点 · 标签 · 关联',
  'landing.step3': '学会为止',
  'landing.step3d': '追问 · 图谱 · 间隔复习',

  'top.lang': '语言',
  'top.theme': '主题',
  'top.ollama': '本地模型',
  'top.ollamaHint': '接入 Ollama 获得更高质量的卡片（可选）',
  'top.export': '导出',
  'top.add': '新增资料',
  'top.reset': '清空',
  'top.resetConfirm': '清空所有资料和知识卡？此操作不可撤销。',

  'pane.source': '原文',
  'pane.cards': '知识卡',
  'pane.chat': '问答',

  'tab.cards': '卡片',
  'tab.graph': '图谱',
  'tab.review': '复习',

  'deck.empty': '还没有知识卡。导入资料后，卡片会一张张出现在这里。',
  'deck.generating': '正在生成…',
  'deck.search': '搜索卡片…',
  'deck.all': '全部',
  'deck.due': '待复习 {n}',
  'deck.star': '收藏',
  'deck.unstar': '取消收藏',
  'deck.hide': '隐藏',
  'deck.unhide': '取消隐藏',
  'deck.png': '存为图片',
  'deck.locate': '定位原文',
  'deck.related': '相关',
  'deck.count': '{n} 张卡片',

  'source.empty': '导入的原文会显示在这里，点击卡片可自动定位。',
  'source.chars': '{n} 字',

  'graph.empty': '生成卡片后，这里会显示概念图谱。',
  'graph.hint': '拖动节点可调整布局 · 点击节点查看卡片',
  'graph.nodes': '{n} 个概念 · {e} 条关联',

  'review.empty': '暂无待复习的卡片。',
  'review.allDone': '今天的复习完成了',
  'review.show': '显示答案',
  'review.again': '重来',
  'review.hard': '困难',
  'review.good': '一般',
  'review.easy': '简单',
  'review.left': '剩余 {n}',
  'review.start': '开始复习（{n} 张）',

  'chat.placeholder': '就这份资料提问…',
  'chat.ask': '提问',
  'chat.empty': '基于你的知识卡回答，并标注来源。',
  'chat.thinking': '思考中…',
  'chat.sources': '来源',
  'chat.noAnswer': '在这份资料里没找到直接答案。换个说法，或看看左侧的卡片。',

  'export.md': 'Markdown / Obsidian',
  'export.anki': 'Anki (CSV)',
  'export.json': 'JSON 备份',

  'msg.parsing': '正在解析…',
  'msg.pdfPages': '已读取 {n} 页',
  'msg.importFailed': '导入失败：{e}',
  'msg.urlFailed': '抓取失败（多数网站禁止跨域）。可以打开网页全选复制，再粘贴进来。',
  'msg.emptyText': '没有读到可用文本。',
  'msg.ollamaFailed': '连不上 Ollama，已自动改用离线模式。',
  'msg.copied': '已复制',
} as const

export type I18nKey = keyof typeof zh

const en: Record<I18nKey, string> = {
  'brand.tagline': 'Turn anything into knowledge cards',

  'landing.title': 'Turn anything into a deck of knowledge cards',
  'landing.sub': 'Drop a PDF, paste an article or your notes — get browsable, askable, reviewable cards in seconds. Runs fully on your machine. No sign-up, no API key.',
  'landing.drop': 'Drop a PDF / TXT / Markdown here',
  'landing.or': 'or',
  'landing.choose': 'Choose file',
  'landing.paste': 'Paste text directly…',
  'landing.sample': 'Try the sample',
  'landing.generate': 'Generate cards',
  'landing.urlPlaceholder': 'Paste a web link https://…',
  'landing.fetch': 'Fetch',
  'landing.privacy': '100% local · never leaves your browser · free & open source',
  'landing.step1': 'Import',
  'landing.step1d': 'PDF / text / web page',
  'landing.step2': 'Auto cards',
  'landing.step2d': 'Summary · points · tags · links',
  'landing.step3': 'Actually learn it',
  'landing.step3d': 'Ask · graph · spaced review',

  'top.lang': 'Language',
  'top.theme': 'Theme',
  'top.ollama': 'Local model',
  'top.ollamaHint': 'Connect Ollama for higher quality cards (optional)',
  'top.export': 'Export',
  'top.add': 'Add source',
  'top.reset': 'Reset',
  'top.resetConfirm': 'Delete all sources and cards? This cannot be undone.',

  'pane.source': 'Source',
  'pane.cards': 'Cards',
  'pane.chat': 'Ask',

  'tab.cards': 'Cards',
  'tab.graph': 'Graph',
  'tab.review': 'Review',

  'deck.empty': 'No cards yet. Import something and they will appear here one by one.',
  'deck.generating': 'Generating…',
  'deck.search': 'Search cards…',
  'deck.all': 'All',
  'deck.due': '{n} due',
  'deck.star': 'Star',
  'deck.unstar': 'Unstar',
  'deck.hide': 'Hide',
  'deck.unhide': 'Unhide',
  'deck.png': 'Save as image',
  'deck.locate': 'Locate in source',
  'deck.related': 'Related',
  'deck.count': '{n} cards',

  'source.empty': 'Imported text shows up here. Click a card to jump to its origin.',
  'source.chars': '{n} chars',

  'graph.empty': 'The concept graph appears once you have cards.',
  'graph.hint': 'Drag nodes to rearrange · click a node to open the card',
  'graph.nodes': '{n} concepts · {e} links',

  'review.empty': 'Nothing due right now.',
  'review.allDone': "You're done for today",
  'review.show': 'Show answer',
  'review.again': 'Again',
  'review.hard': 'Hard',
  'review.good': 'Good',
  'review.easy': 'Easy',
  'review.left': '{n} left',
  'review.start': 'Start review ({n})',

  'chat.placeholder': 'Ask about this source…',
  'chat.ask': 'Ask',
  'chat.empty': 'Answers are grounded in your cards, with citations.',
  'chat.thinking': 'Thinking…',
  'chat.sources': 'Sources',
  'chat.noAnswer': 'No direct answer in this source. Try rephrasing, or browse the cards.',

  'export.md': 'Markdown / Obsidian',
  'export.anki': 'Anki (CSV)',
  'export.json': 'JSON backup',

  'msg.parsing': 'Parsing…',
  'msg.pdfPages': 'Read {n} pages',
  'msg.importFailed': 'Import failed: {e}',
  'msg.urlFailed': 'Fetch blocked (most sites disallow cross-origin). Open the page, select all, and paste it here.',
  'msg.emptyText': 'No readable text found.',
  'msg.ollamaFailed': 'Ollama unreachable — fell back to offline mode.',
  'msg.copied': 'Copied',
}

const ja: Record<I18nKey, string> = {
  'brand.tagline': 'あらゆる資料をナレッジカードに',

  'landing.title': 'あらゆる資料を、ナレッジカードの束に',
  'landing.sub': 'PDF をドロップ、記事やメモを貼り付けるだけ。読める・聞ける・復習できるカードが数秒で完成。すべてローカルで動作、登録も API キーも不要。',
  'landing.drop': 'PDF / TXT / Markdown をここにドロップ',
  'landing.or': 'または',
  'landing.choose': 'ファイルを選択',
  'landing.paste': 'テキストを貼り付け…',
  'landing.sample': 'サンプルを試す',
  'landing.generate': 'カードを生成',
  'landing.urlPlaceholder': 'ウェブリンクを貼り付け https://…',
  'landing.fetch': '取得',
  'landing.privacy': '100% ローカル · ブラウザ外に出ない · オープンソース',
  'landing.step1': '取り込む',
  'landing.step1d': 'PDF / テキスト / ウェブ',
  'landing.step2': '自動でカード化',
  'landing.step2d': '要約 · 要点 · タグ · 関連',
  'landing.step3': '身につくまで',
  'landing.step3d': '質問 · グラフ · 間隔反復',

  'top.lang': '言語',
  'top.theme': 'テーマ',
  'top.ollama': 'ローカルモデル',
  'top.ollamaHint': 'Ollama を接続するとカードの質が上がります（任意）',
  'top.export': 'エクスポート',
  'top.add': '資料を追加',
  'top.reset': 'リセット',
  'top.resetConfirm': 'すべての資料とカードを削除しますか？元に戻せません。',

  'pane.source': '原文',
  'pane.cards': 'カード',
  'pane.chat': '質問',

  'tab.cards': 'カード',
  'tab.graph': 'グラフ',
  'tab.review': '復習',

  'deck.empty': 'まだカードがありません。資料を取り込むと順に表示されます。',
  'deck.generating': '生成中…',
  'deck.search': 'カードを検索…',
  'deck.all': 'すべて',
  'deck.due': '復習 {n} 件',
  'deck.star': 'お気に入り',
  'deck.unstar': '解除',
  'deck.hide': '非表示',
  'deck.unhide': '再表示',
  'deck.png': '画像として保存',
  'deck.locate': '原文へ',
  'deck.related': '関連',
  'deck.count': 'カード {n} 枚',

  'source.empty': '取り込んだ原文がここに表示されます。カードをクリックすると該当箇所へ移動します。',
  'source.chars': '{n} 文字',

  'graph.empty': 'カードを作るとコンセプトグラフが表示されます。',
  'graph.hint': 'ノードをドラッグして配置 · クリックでカードを表示',
  'graph.nodes': '{n} 概念 · {e} 関連',

  'review.empty': '今は復習するカードがありません。',
  'review.allDone': '今日の復習は完了です',
  'review.show': '答えを見る',
  'review.again': 'もう一度',
  'review.hard': '難しい',
  'review.good': '普通',
  'review.easy': '簡単',
  'review.left': '残り {n}',
  'review.start': '復習を始める（{n} 枚）',

  'chat.placeholder': 'この資料について質問…',
  'chat.ask': '質問',
  'chat.empty': 'カードに基づいて、出典付きで回答します。',
  'chat.thinking': '考え中…',
  'chat.sources': '出典',
  'chat.noAnswer': 'この資料には直接の答えが見つかりません。言い換えるか、カードをご覧ください。',

  'export.md': 'Markdown / Obsidian',
  'export.anki': 'Anki (CSV)',
  'export.json': 'JSON バックアップ',

  'msg.parsing': '解析中…',
  'msg.pdfPages': '{n} ページを読み込みました',
  'msg.importFailed': '取り込み失敗：{e}',
  'msg.urlFailed': '取得できませんでした（多くのサイトは CORS を許可していません）。ページを全選択してコピーし、貼り付けてください。',
  'msg.emptyText': '読み取れるテキストがありません。',
  'msg.ollamaFailed': 'Ollama に接続できないため、オフラインモードに切り替えました。',
  'msg.copied': 'コピーしました',
}

const DICTS: Record<UiLang, Record<I18nKey, string>> = { zh, en, ja }

export const LANG_LABELS: Record<UiLang, string> = {
  zh: '中文',
  en: 'EN',
  ja: '日本語',
}

export function translate(
  lang: UiLang,
  key: I18nKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = DICTS[lang][key] ?? DICTS.en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v))
    }
  }
  return s
}

export type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string

export function makeT(lang: UiLang): TFn {
  return (key, vars) => translate(lang, key, vars)
}

/** Best-effort language guess of the source text, used for card templates. */
export function detectLang(text: string): UiLang {
  const sample = text.slice(0, 2000)
  const kana = (sample.match(/[\u3040-\u30ff]/g) || []).length
  const han = (sample.match(/[\u4e00-\u9fa5]/g) || []).length
  if (kana > 5 && kana * 3 > han) return 'ja'
  if (han > sample.length * 0.1) return 'zh'
  return 'en'
}
