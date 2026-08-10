<div align="center">

# Synth

**あらゆる PDF・記事・メモを、読める・聞ける・復習できるナレッジカードの束に。**

100% ローカル動作 · 登録不要 · API キー不要 · MIT

[![CI](https://github.com/zhangxuhan/synth/actions/workflows/ci.yml/badge.svg)](https://github.com/zhangxuhan/synth/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#コントリビュート)
[![Stars](https://img.shields.io/github/stars/zhangxuhan/synth?style=social)](https://github.com/zhangxuhan/synth)

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語**

**▶ ライブデモ：** https://zhangxuhan.github.io/synth/

<img src="docs/preview.png" alt="Synth スクリーンショット" width="820">

</div>

---

## なぜもう一つ学習ツールを作るのか

「PDF とチャットする」ツールが残すのは、チャットログだけです。タブを閉じれば何も残りません。

Synth は**チャット優先ではなくカード優先**です。資料は構造化されたカードの集合になり、
ざっと眺め、関連づけ、問いを立て、そして**実際に記憶できる**。チャットは右側の補助パネルにすぎません。

|                          | Chat-with-PDF 系 | Anki | **Synth** |
| ------------------------ | :--------------: | :--: | :-------: |
| 構造化カード             |        –         | ✅ 手作業 | ✅ 自動 |
| コンセプトグラフ         |        –         |  –   |    ✅     |
| 間隔反復                 |        –         |  ✅  |    ✅     |
| 出典付きの Q&A           |        ✅        |  –   |    ✅     |
| API キー不要             |        –         |  ✅  |    ✅     |
| データが端末から出ない   |        –         |  ✅  |    ✅     |

## 特長

- **ドロップするだけ** —— PDF・TXT・Markdown・プレーンテキスト・ウェブページ。ウィンドウのどこにドロップしても OK。
- **ストリーミング生成** —— 種別・要約・要点・タグ付きのカードが一枚ずつ現れ、原文の該当箇所へ正確に戻れます。
- **コンセプトグラフ** —— タグの重なりでカード同士がつながり、力学配置のグラフをドラッグ・クリックできます。
- **間隔反復** —— SM-2 スケジューラ。4 段階評価、次回間隔のプレビュー、キーボード操作に対応。
- **根拠のある回答** —— 自分のカードに対する BM25 検索。すべての回答が参照したカードを明示します。
- **どこへでもエクスポート** —— Markdown / Obsidian、Anki 取り込み用 TSV、JSON バックアップ、カード 1 枚を共有用 PNG に。
- **三言語 UI** —— 日本語 / English / 简体中文 をいつでも切り替え可能。
- **設定ゼロ** —— 既定の抽出器は完全オフラインかつ決定的。より高品質が欲しいときだけ Ollama を有効にします。
- **端末の外に出ない** —— バックエンドもテレメトリもなし。すべてブラウザの `localStorage` に保存されます。

## クイックスタート

```bash
git clone https://github.com/zhangxuhan/synth.git
cd synth
npm install
npm run dev
```

http://localhost:5173 を開いて「サンプルを試す」をクリック。オンボーディングはこれだけです。

`npm run build` で生成される `dist/` は純粋な静的サイトなので、GitHub Pages・Netlify・
Cloudflare Pages にそのままデプロイできます。

### デスクトップ版（Windows / macOS / Linux）

ブラウザのタブではなくネイティブアプリがいいなら、[GitHub Releases](https://github.com/zhangxuhan/synth/releases) からプリビルド済みインストーラを取得してください。ダブルクリックでインストールし、完全オフラインで動作します。ウェブ版と同じ機能で、データはあなたの端末に保存されます。

自分でビルドする場合：

```bash
npm install
npm run tauri:dev      # ホットリロード付き開発
npm run tauri:build    # インストーラは src-tauri/target/release/bundle/ に出力
```

### 任意：ローカル LLM でカードの質を上げる

モデルなしでも動作します。より豊かなカードが欲しい場合は [Ollama](https://ollama.com) を起動してください。

```bash
ollama pull qwen2.5:7b
OLLAMA_ORIGINS='*' ollama serve
```

上部バーの「ローカルモデル」を有効にします。Ollama に接続できない場合は自動的にオフライン抽出へ
フォールバックするため、行き止まりにはなりません。

## キーボードショートカット

| キー              | 動作                          |
| ----------------- | ----------------------------- |
| `Space`           | 復習モードで答えを表示        |
| `1` `2` `3` `4`   | もう一度 / 難しい / 普通 / 簡単 |
| `Ctrl/⌘ + Enter`  | 貼り付けたテキストから生成    |

## 仕組み

```
原文 ──► 正規化 ──► 見出し単位の分割 ──► TF-IDF スコアリング ──► カード
                                              │
                        タグの重なり ─────────┼──► コンセプトグラフ
                        SM-2 スケジューラ ────┼──► 復習キュー
                        BM25 検索 ────────────┴──► 出典付き Q&A
```

オフラインのパイプラインは決定的で外部依存がありません。見出しで分割し、TF-IDF で文を採点し、
要約文と補足の要点を選び、タグを抽出し、タグが重なるカード同士を接続します。
埋め込みモデルも、通信も、待ち時間もありません。

## 技術スタック

React 18 · TypeScript · Vite · pdf.js のみ。ランタイム依存は 3 つ、アプリ本体は gzip 約 50 KB
（pdf.js は PDF を取り込むときだけ遅延ロード）。

```
src/
  lib/        text.ts · generator.ts · search.ts · srs.ts · importers.ts · exporters.ts · store.ts
  components/ TopBar · Landing · SourcePane · DeckPane · CardItem · GraphView · ReviewPane · ChatPane
```

## ロードマップ

- [ ] ローカル Whisper による YouTube / 音声の文字起こし
- [ ] 穴埋め（Cloze）カード
- [ ] メディア込みの本物の `.apkg` エクスポート
- [x] Tauri デスクトップ版（ダブルクリックでインストール）
- [ ] ライブラリ全体を横断するグラフ

## コントリビュート

Issue と PR を歓迎します。特にインポーター、言語パック、カード品質のヒューリスティックを。

```bash
npm run check   # 型チェック + スモークテスト + ビルド
```

## ライセンス

MIT © contributors

<div align="center">

Synth で 1 時間節約できたら、⭐ を付けていただけると他の人にも届きます。

</div>
