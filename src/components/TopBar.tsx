import { useRef } from 'react'
import { UiLang, Workspace } from '../types'
import { LANG_LABELS, TFn } from '../i18n'
import { download, slugify, toAnkiTsv, toJson, toMarkdown } from '../lib/exporters'

interface Props {
  ws: Workspace
  t: TFn
  compact: boolean
  onPatch: (p: Partial<Workspace>) => void
  onReset: () => void
  onAddFiles: (files: FileList | File[]) => void
  onSample: () => void
}

const LANGS: UiLang[] = ['zh', 'en', 'ja']

export function TopBar({ ws, t, compact, onPatch, onReset, onAddFiles }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const name = slugify(ws.docs[ws.docs.length - 1]?.title ?? 'synth')

  return (
    <header className="topbar">
      <div className="brand">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="13" height="15" rx="3" fill="var(--accent)" opacity="0.35" />
          <rect x="8" y="3" width="13" height="15" rx="3" fill="var(--accent)" />
        </svg>
        <strong>Synth</strong>
        <span className="brand-sub">{t('brand.tagline')}</span>
      </div>

      <div className="topbar-right">
        {!compact && (
          <>
            <button className="ghost" onClick={() => fileRef.current?.click()}>
              + {t('top.add')}
            </button>
            <details className="menu">
              <summary className="ghost">{t('top.export')}</summary>
              <div className="menu-body">
                <button
                  onClick={() => download(`${name}.md`, toMarkdown(ws.docs, ws.cards), 'text/markdown')}
                >
                  {t('export.md')}
                </button>
                <button onClick={() => download(`${name}-anki.txt`, toAnkiTsv(ws.cards), 'text/plain')}>
                  {t('export.anki')}
                </button>
                <button
                  onClick={() => download(`${name}.json`, toJson(ws.docs, ws.cards), 'application/json')}
                >
                  {t('export.json')}
                </button>
              </div>
            </details>
          </>
        )}

        <details className="menu">
          <summary className="ghost" title={t('top.ollamaHint')}>
            <span className={`dot ${ws.useOllama ? 'on' : ''}`} />
            {ws.useOllama ? ws.model.split(':')[0] : t('top.ollama')}
          </summary>
          <div className="menu-body wide">
            <label className="switch">
              <input
                type="checkbox"
                checked={ws.useOllama}
                onChange={(e) => onPatch({ useOllama: e.target.checked })}
              />
              <span>{t('top.ollama')}</span>
            </label>
            <p className="hint">{t('top.ollamaHint')}</p>
            <input
              className="field"
              value={ws.model}
              onChange={(e) => onPatch({ model: e.target.value })}
              placeholder="qwen2.5:7b"
              spellCheck={false}
            />
            <code className="code">ollama serve</code>
          </div>
        </details>

        <div className="seg">
          {LANGS.map((l) => (
            <button
              key={l}
              className={ws.lang === l ? 'on' : ''}
              onClick={() => onPatch({ lang: l })}
              title={t('top.lang')}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>

        <button
          className="icon"
          title={t('top.theme')}
          onClick={() => onPatch({ theme: ws.theme === 'dark' ? 'light' : 'dark' })}
        >
          {ws.theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4a8 8 0 108 8 6 6 0 01-8-8z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4.5" />
              <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        {!compact && (
          <button className="icon danger" title={t('top.reset')} onClick={onReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z" />
            </svg>
          </button>
        )}

        <a
          className="icon"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          title="Star on GitHub"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38l-.01-1.49C3.8 14.16 3.34 12.9 3.34 12.9c-.36-.92-.88-1.17-.88-1.17-.72-.49.05-.48.05-.48.8.06 1.22.82 1.22.82.71 1.21 1.87.86 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown,.csv,.json,.srt,.vtt,text/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onAddFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </header>
  )
}
