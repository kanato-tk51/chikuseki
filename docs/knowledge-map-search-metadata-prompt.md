# Knowledge Map Search Metadata Prompt

このプロンプトは、既存の domain YAML に `search` metadata を追加するためのドラフト作成依頼に使う。

目的は、外部テキスト、会話ログ、記事、メモを Knowledge Node 候補へ照合しやすくすること。説明文を増やすのではなく、検索・候補生成に効く具体語を増やす。

## 使い方

1 domain ずつ実行する。最初から全 Term を対象にせず、まずは主要 Term 30〜50個に絞る。

貼り付けるもの:

- 対象 domain YAML
- 必要なら、重点的に拾いたい技術領域や最近読んでいる資料の傾向

返してほしいもの:

- `domainSlug`
- `entries`
- 各 entry の `slug` と `search`

この出力を Codex に渡して、既存 YAML へ反映する。

## Copy Prompt

```text
あなたは技術学習アプリの Knowledge Map マスターデータを整備するアシスタントです。

目的:
外部テキスト、会話ログ、記事、メモを Knowledge Node 候補へ照合しやすくするため、既存 domain YAML の主要 Term に search metadata を追加するドラフトを作ってください。

重要:
- 既存の slug、階層、name、summary、whyLearn、promptHint、aliases、edges は変更しないでください。
- 今回は search metadata のドラフトだけを作ってください。
- 対象は主要 Term 30〜50個に絞ってください。
- Concept / Topic Cluster ではなく、原則 Term を優先してください。
- search は説明文の重複ではなく、検索・候補生成に効く具体語を優先してください。
- その分野を学ぶエンジニアが未知のライブラリ、フレームワーク、ツール、標準、プロトコル、パターン名に出会えるようにしてください。
- ただし、流行語や不安定な製品名を盛りすぎないでください。実務で広く見かける、比較的安定した名前を優先してください。
- YAML 内に引用やURL一覧は入れないでください。officialUrl は本当に安定した公式ページが明確な場合だけで構いません。

search schema:

search:
  keywords:
    - 候補生成に使える同義語、略称、英語名、日本語名、周辺語
  relatedNames:
    - name: 実務上よく一緒に出るライブラリ、フレームワーク、ツール、標準、プロトコル、サービス、パターンなどの具体名
      kind: library | framework | tool | standard | protocol | service | platform | pattern | language | method | other
      relevance: なぜその Term と一緒に出るかを1文で説明
      officialUrl: 公式URL。任意
  commonSignals:
    - Resource / Note / 会話本文に出たらこの Term の候補にしやすい語句や状況表現
  antiSignals:
    - 出てもその Term とは限らない誤爆しやすい語句や除外条件

量の目安:
- keywords: 5〜12個
- relatedNames: 0〜8個
- commonSignals: 2〜6個
- antiSignals: 1〜5個

品質基準:
- "performance", "security", "frontend" のような広すぎる語だけで埋めないでください。
- 略称がある場合は正式名と略称の両方を入れてください。
- 日本語資料と英語資料の両方で拾えるよう、日本語・英語を混ぜてください。
- relatedNames は、知らない人が検索して学習を広げられる具体名にしてください。
- antiSignals は誤爆を減らすために必ず入れてください。
- 同じ relatedName を大量の Term に機械的に付けないでください。関連が強い場所だけにしてください。

出力形式:
説明文は書かず、次の YAML だけを返してください。

domainSlug: <対象domainのslug>
entries:
  - slug: <既存Termのslug>
    search:
      keywords:
        - ...
      relatedNames:
        - name: ...
          kind: ...
          relevance: ...
          officialUrl: ...
      commonSignals:
        - ...
      antiSignals:
        - ...

対象 domain YAML:

```yaml
ここに既存の domain YAML を貼る
```
```

## Codex へ渡すとき

外部LLMから返ってきた YAML を貼って、次のように依頼する。

```text
この search metadata draft を、対応する data/knowledge-map/domain-details/<domain>.yaml の既存 Term に反映してください。既存階層や slug は変更せず、pnpm knowledge-map:validate と pnpm knowledge-map:import まで実行してください。
```
