import { useRef, useState } from 'react'
import { I18nKey, TFn } from '../i18n'

const STEPS: [I18nKey, I18nKey][] = [
  ['landing.step1', 'landing.step1d'],
  ['landing.step2', 'landing.step2d'],
  ['landing.step3', 'landing.step3d'],
]

interface Props {
  t: TFn
  onText: (text: string, title?: string) => void
  onFiles: (files: FileList | File[]) => void
  onUrl: (url: string, useProxy: boolean) => void
  onSample: () => void
}

export function Landing({ t, onText, onFiles, onUrl, onSample }: Props) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [proxy, setProxy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isUrl = /^https?:\/\/\S+$/i.test(text.trim())

  function submit() {
    const v = text.trim()
    if (!v) return
    if (isUrl) onUrl(v, proxy)
    else onText(v)
    setText('')
  }

  return (
    <div className="landing">
      <div className="landing-inner">
        <h1>{t('landing.title')}</h1>
        <p className="lede">{t('landing.sub')}</p>

        <div
          className="dropzone"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16"
              stroke="var(--accent)"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <strong>{t('landing.drop')}</strong>
            <span className="muted">
              {' '}
              {t('landing.or')} <u>{t('landing.choose')}</u>
            </span>
          </div>
        </div>

        <textarea
          className="paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${t('landing.paste')}  (${t('landing.urlPlaceholder')})`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
        />

        <div className="landing-actions">
          <button className="primary big" disabled={!text.trim()} onClick={submit}>
            {isUrl ? t('landing.fetch') : t('landing.generate')}
          </button>
          <button className="ghost big" onClick={onSample}>
            {t('landing.sample')}
          </button>
          {isUrl && (
            <label className="switch small">
              <input type="checkbox" checked={proxy} onChange={(e) => setProxy(e.target.checked)} />
              <span>proxy</span>
            </label>
          )}
        </div>

        <div className="steps">
          {STEPS.map(([a, b], i) => (
            <div className="step" key={a}>
              <span className="step-n">{i + 1}</span>
              <div>
                <strong>{t(a)}</strong>
                <p>{t(b)}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="privacy">{t('landing.privacy')}</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown,.csv,.json,.srt,.vtt,text/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
