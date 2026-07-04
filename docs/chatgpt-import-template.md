# ChatGPT Import Template

ブラウザ版 ChatGPT で得た知見を chikuseki に取り込むためのプロンプトと JSON template。

アプリでは `/imports/chatgpt` に、下記の prompt と JSON template を結合したコピー用プロンプトを表示する。ユーザーは `Copy prompt` を押して、そのまま ChatGPT に貼り付ける。

この template は、後続の OpenAI API 連携でも structured output の schema として使う。

## Prompt

```text
あなたは、技術学習のために会話から復習用 Question を作るアシスタントです。

この会話で出てきた技術名、設計判断、比較軸、落とし穴、周辺技術を拾い、後で自分が説明・判断できるようにする学習ノートと Question を作ってください。

要件:
- 出力は JSON のみ。Markdown のコードフェンスや説明文は付けない
- JSON template と同じ構造・フィールド名で出力する
- sources は、元になった記事・会話・URL ごとに分ける。なければ空配列にする
- sources[].key は短い英数字の識別子にする
- 会話の本筋だけでなく、文中に出てきた技術語や比較対象も学習対象として拾う
- 文中で詳しく説明されていない技術語でも、理解しておくべきものは一般知識を補って Question にする
- items は学習テーマごとに分ける。例: API 設計、認証・認可、非同期処理、検索、状態管理
- items[].sourceKeys には、その note が参照した sources[].key だけを入れる
- note.bodyMd には、会話の要約ではなく、そのテーマで覚えるべき概念、判断軸、注意点、まだ曖昧な点を Markdown でまとめる
- questions は 1 問 1 答にし、同じ item の学習テーマに関係する問題だけを入れる
- questionMd は「何を思い出すべきか」が明確な問いにする
- answerMd は短く正確にする
- explanationMd には、定義、使われ方、メリット・デメリット、選定基準、代替技術、現場での見られ方、落とし穴、関連知識を書く
- 「どれがデファクトか」「現在のトレンド」は、知識の範囲で理由付きで書く。最新性に自信がない場合は、要確認であることを明記する
- 具体名が出た技術は、必要に応じて並列比較される技術も Question に含める。例: REST / GraphQL / tRPC、RBAC / ABAC、WebSocket / SSE / polling
- 単なる本文確認ではなく、今後の技術選定や設計レビューで使える Question を優先する
- 重要な技術語が多い場合は、浅く網羅しすぎず、復習価値の高いものを優先する
- difficulty は easy / medium / hard のいずれか
- status は draft にする
- 不明なことを断定しない
- 学習ノートとして残すには情報が不十分でも、本文中の技術語から復習価値のある Question を作れるなら作る

JSON template は下記の JSON Template をこの位置に含める:
```

## JSON Template

```json
{
  "version": "chikuseki.chatgpt_import.v1",
  "sources": [
    {
      "key": "chatgpt-conversation",
      "title": "ChatGPT conversation: 技術選定の学習テーマ",
      "type": "other",
      "url": null,
      "sourceName": "ChatGPT",
      "author": null,
      "summary": "BtoB SaaS を題材に、API 設計、認証・認可、非同期処理、検索などの判断ポイントを整理した会話。",
      "memo": "文中に出てきた技術語や比較軸を復習問題として拾う例。"
    },
    {
      "key": "nextjs-docs-api-routes",
      "title": "Next.js Docs: API Routes / Route Handlers",
      "type": "docs",
      "url": "https://nextjs.org/docs",
      "sourceName": "Next.js Docs",
      "author": null,
      "summary": "Next.js でサーバー側の HTTP endpoint を扱う機能。",
      "memo": null
    }
  ],
  "items": [
    {
      "sourceKeys": ["chatgpt-conversation", "nextjs-docs-api-routes"],
      "note": {
        "title": "API 設計の選択肢を比較して判断できるようにする",
        "noteType": "other",
        "bodyMd": "## 学んだこと\n\nBtoB SaaS のような題材では、REST、GraphQL、tRPC、Next.js Route Handlers、Go API サーバーなど、API 境界の選び方が設計判断になる。\n\n## 復習したい観点\n\n- それぞれの API 方式の特徴とメリット・デメリット\n- どれが現場でよく使われるか、その理由\n- フロントエンドとバックエンドを分ける判断基準"
      },
      "questions": [
        {
          "title": "Next.js Route Handler / API Route とは何か？",
          "questionMd": "Next.js の Route Handler / API Route は何をするための機能で、どのような場面で使うのか？",
          "answerMd": "Next.js アプリ内に HTTP endpoint を定義し、サーバー側でリクエスト処理、DB 操作、外部 API 連携などを行うための機能。",
          "explanationMd": "小規模なフルスタックアプリでは Next.js 内に API を置くと開発が速い。一方で、複雑なドメイン、複数クライアント、独立デプロイが必要な場合は Go などで API サーバーを分ける判断が出てくる。",
          "difficulty": "easy",
          "status": "draft"
        },
        {
          "title": "REST / GraphQL / tRPC はどう使い分ける？",
          "questionMd": "REST、GraphQL、tRPC の主な違い、メリット・デメリット、選定基準は何か？",
          "answerMd": "REST は標準的でシンプル、GraphQL は取得形状の柔軟性が高く、tRPC は TypeScript 同士で型安全な API を作りやすい。",
          "explanationMd": "現場では REST が依然として広く使われる。GraphQL は複雑なクライアント要求や BFF 的な用途で強いが運用設計が増える。tRPC は TypeScript フルスタックでは強力だが、非 TypeScript クライアントや公開 API には向きにくい。",
          "difficulty": "medium",
          "status": "draft"
        }
      ]
    },
    {
      "sourceKeys": ["chatgpt-conversation"],
      "note": {
        "title": "認証・認可と非同期処理は実務的な設計判断になりやすい",
        "noteType": "other",
        "bodyMd": "## 学んだこと\n\n認証、認可、通知、ファイルアップロード、非同期ジョブ、検索は、単に実装するだけでなく方式選定や運用上の落とし穴を考える必要がある。\n\n## 復習したい観点\n\n- RBAC と ABAC の違い\n- 同期処理と非同期処理の使い分け\n- キュー、リトライ、冪等性の基本"
      },
      "questions": [
        {
          "title": "RBAC と ABAC は何が違う？",
          "questionMd": "認可設計で出てくる RBAC と ABAC は何が違い、どのような場面で使い分けるのか？",
          "answerMd": "RBAC は role に基づく認可、ABAC は user・resource・環境などの属性に基づく認可。",
          "explanationMd": "RBAC は理解しやすく管理しやすいため多くの業務アプリの出発点になる。ABAC は細かい条件を表現しやすいが、ルールが複雑化しやすい。最初は RBAC で始め、必要な条件だけ属性ベースの判定を足す設計が現実的なことが多い。",
          "difficulty": "medium",
          "status": "draft"
        },
        {
          "title": "非同期ジョブで冪等性が重要な理由は？",
          "questionMd": "通知送信やファイル変換のような非同期ジョブで、なぜリトライと冪等性を設計する必要があるのか？",
          "answerMd": "ジョブは失敗や重複実行が起こり得るため、再実行しても同じ副作用が重複しないようにする必要がある。",
          "explanationMd": "キューやワーカーではネットワーク失敗、タイムアウト、プロセス停止などで同じ処理が複数回走ることがある。メール重複送信、二重課金、重複レコード作成を防ぐため、idempotency key や状態遷移チェックを設計する。",
          "difficulty": "hard",
          "status": "draft"
        }
      ]
    }
  ]
}
```

## Import Behavior

- `sources[]` から Resource を作る
- import 画面で Chat URL を入力した場合は、ChatGPT source の URL として優先して保存し、全 item に関連付ける
- `items[]` から Learning Note を作る
- `items[].sourceKeys` の先頭 Resource は `learning_notes.resource_id` に保存する
- `items[].sourceKeys` の全 Resource は `entity_links.relation_type = "references_resource"` で Learning Note に関連付ける
- `items[].questions[]` は Question Card draft として作る
- 同じ item から作成した Learning Note と Question Card は `entity_links.relation_type = "derived_question"` で関連付ける
- 1件の note だけ import した場合は note detail に戻り、複数 note の場合は `/notes` に戻る
