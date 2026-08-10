import { UiLang } from '../types'

const zh = `Transformer 架构入门

什么是注意力机制
注意力机制是指模型在处理某个词时，动态地决定应该"关注"输入中的哪些其它词。它把每个词映射成查询、键、值三个向量，用查询与所有键做点积得到相关性分数，再对值做加权求和。相比循环神经网络逐个时间步传递状态，注意力让任意两个位置直接连通，路径长度是常数。

自注意力为什么高效
自注意力的所有位置可以并行计算，不像 RNN 必须按顺序展开，因此能充分利用 GPU。代价是计算复杂度与序列长度成平方关系：序列长度翻一倍，计算量变成四倍。这也是长上下文模型必须引入稀疏注意力、滑动窗口或线性注意力等近似方法的原因。

多头注意力
多头注意力把表示切分成若干个子空间，每个头独立计算注意力，最后拼接。不同的头会自发学到不同的模式：有的头关注相邻词，有的头追踪句法依存，有的头负责指代消解。这相当于让模型同时从多个角度观察同一个句子。

位置编码
注意力本身对顺序不敏感，打乱输入词序，输出集合不变。因此必须显式注入位置信息。原始论文使用正弦位置编码，如今主流做法是旋转位置编码 RoPE，它把位置信息编码成向量的旋转角度，能更自然地外推到训练时未见过的更长序列。

训练流程分三步
第一步是预训练，在海量无标注文本上做下一个词预测，让模型学到语言的统计结构。第二步是监督微调，用高质量的指令与回答数据对，教模型遵循人类的指令格式。第三步是偏好对齐，常用 RLHF 或 DPO，根据人类对回答优劣的排序来调整模型倾向。

常见误解
很多人以为参数量越大效果一定越好。事实上 Chinchilla 的研究表明，在固定的算力预算下，模型参数与训练数据量应当同比例增长，很多早期大模型其实是训练不足的。数据质量往往比参数规模更能决定最终表现。`

const en = `A Short Introduction to Transformers

What attention actually does
Attention is a mechanism that lets a model decide, for every token it processes, which other tokens in the input it should look at. Each token is projected into a query, a key and a value vector. The dot product between a query and all keys produces relevance scores, and the output is a weighted sum of the values. Unlike a recurrent network that passes state one step at a time, attention connects any two positions with a constant-length path.

Why self-attention is fast, and where it hurts
Every position in self-attention can be computed in parallel, so the operation maps neatly onto GPUs. The price is quadratic cost: doubling the sequence length quadruples the computation. This is exactly why long-context models rely on approximations such as sparse attention, sliding windows or linear attention.

Multi-head attention
Multi-head attention splits the representation into several subspaces, runs attention independently in each head, and concatenates the results. Different heads reliably specialise: some track adjacent tokens, some follow syntactic dependencies, and some resolve coreference. The model effectively looks at the same sentence from several angles at once.

Positional encoding
Attention is permutation invariant. Shuffle the input tokens and the output set does not change, so position must be injected explicitly. The original paper used sinusoidal encodings; modern systems mostly use rotary position embeddings (RoPE), which encode position as a rotation angle and extrapolate more gracefully to sequences longer than those seen in training.

Training happens in three stages
Pretraining comes first: next-token prediction over a huge unlabeled corpus teaches the model the statistical structure of language. Supervised fine-tuning follows, using curated instruction and response pairs to teach the model the format humans expect. Finally, preference alignment with RLHF or DPO nudges the model toward answers that humans rank highly.

A common misconception
People often assume that more parameters always means better quality. The Chinchilla results showed that for a fixed compute budget, parameters and training tokens should scale together, and that many early large models were badly undertrained. Data quality usually matters more than raw parameter count.`

const ja = `Transformer 入門

アテンションとは何か
アテンションとは、モデルがあるトークンを処理するときに、入力の中のどのトークンに注目すべきかを動的に決める仕組みです。各トークンはクエリ・キー・バリューの三つのベクトルに射影されます。クエリとすべてのキーの内積が関連度スコアとなり、その重みでバリューを加重平均した結果が出力になります。時系列を一歩ずつ辿る再帰型ネットワークと違い、任意の二地点が定数長の経路で直結します。

自己アテンションの速さと弱点
自己アテンションはすべての位置を並列に計算できるため、GPU の性能を引き出せます。代償は計算量が系列長の二乗に比例することです。系列長が二倍になれば計算量は四倍になります。長文コンテキストのモデルが疎アテンションやスライディングウィンドウ、線形アテンションなどの近似を必要とするのはこのためです。

マルチヘッドアテンション
マルチヘッドアテンションは表現を複数の部分空間に分割し、それぞれのヘッドで独立にアテンションを計算してから連結します。ヘッドごとに役割が分かれ、隣接語を追うもの、構文的な依存関係を辿るもの、照応を解決するものが自然に現れます。同じ文を複数の視点から同時に眺めるのに近い働きです。

位置エンコーディング
アテンション自体は順序に対して不変です。入力の並びを入れ替えても出力の集合は変わりません。そのため位置情報を明示的に注入する必要があります。原論文では正弦波による位置エンコーディングが使われましたが、現在の主流は回転位置埋め込み RoPE です。位置を回転角として符号化するため、学習時より長い系列へも自然に外挿できます。

学習は三段階
第一段階は事前学習で、大量のラベルなしテキストに対する次トークン予測を通じて言語の統計構造を学びます。第二段階は教師ありファインチューニングで、質の高い指示と応答の対を用いて人間が期待する形式を教えます。第三段階は選好アライメントであり、RLHF や DPO によって人間が高く評価する応答へとモデルを寄せていきます。

よくある誤解
パラメータが多いほど必ず性能が上がると考えられがちです。しかし Chinchilla の研究は、固定された計算予算のもとではパラメータ数と学習トークン数を同じ比率で増やすべきであり、初期の大規模モデルの多くは学習不足だったことを示しました。パラメータ規模よりもデータの質が結果を左右することが少なくありません。`

export const SAMPLE_TITLES: Record<UiLang, string> = {
  zh: 'Transformer 架构入门（示例）',
  en: 'A Short Introduction to Transformers (sample)',
  ja: 'Transformer 入門（サンプル）',
}

export function sampleText(lang: UiLang): string {
  return lang === 'en' ? en : lang === 'ja' ? ja : zh
}
