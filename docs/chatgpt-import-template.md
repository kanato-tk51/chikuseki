# ChatGPT Import Template

ブラウザ版 ChatGPT で得た知見を chikuseki に取り込むためのプロンプトと JSON template。

アプリでは `/imports/chatgpt` に、下記の prompt と JSON template を結合したコピー用プロンプトを表示する。ユーザーは `Copy prompt` を押して、そのまま ChatGPT に貼り付ける。

この template は、後続の OpenAI API 連携でも structured output の schema として使う。

## Prompt

```text
あなたは、会話から学習用のノートと復習問題を抽出するアシスタントです。

この会話で得た知見から、後で復習できる学習ノートと復習用 Question を作ってください。
追加で貼り付けた説明・コード・メモがある場合は、それも含めてください。

要件:
- 出力は JSON のみ。Markdown のコードフェンスや説明文は付けない
- JSON template と同じ構造・フィールド名で出力する
- sources は、元になった記事・会話・URL ごとに分ける。なければ空配列にする
- sources[].key は短い英数字の識別子にする
- 会話の中に複数の独立した学びがある場合は items を分ける
- items[].sourceKeys には、その note が参照した sources[].key だけを入れる
- note.bodyMd には、学んだこと、背景、注意点、まだ曖昧な点を Markdown でまとめる
- questions は 1 問 1 答にし、同じ item の note に直接関係する問題だけを入れる
- questionMd は「何を思い出すべきか」が明確な問いにする
- answerMd は短く正確にする
- explanationMd は判断理由、落とし穴、関連知識を書く
- difficulty は easy / medium / hard のいずれか
- status は draft にする
- 不明なことを断定しない
- 学習ノートとして残すには情報が不十分なら、note.bodyMd に不足点を明記し、questions は空配列にする

JSON template は下記の JSON Template をこの位置に含める:
```

## JSON Template

```json
{
  "version": "chikuseki.chatgpt_import.v1",
  "sources": [
    {
      "key": "chatgpt-conversation",
      "title": "ChatGPT conversation: Next.js Server Actions",
      "type": "other",
      "url": null,
      "sourceName": "ChatGPT",
      "author": null,
      "summary": "Server Actions の validation と redirect/revalidate の整理。",
      "memo": "ブラウザ版 ChatGPT で得た知見を chikuseki に取り込むための例。"
    },
    {
      "key": "nextjs-docs-server-actions",
      "title": "Next.js Docs: Server Actions",
      "type": "docs",
      "url": "https://nextjs.org/docs",
      "sourceName": "Next.js Docs",
      "author": null,
      "summary": "Server Actions の基本的な使い方。",
      "memo": null
    }
  ],
  "items": [
    {
      "sourceKeys": ["chatgpt-conversation", "nextjs-docs-server-actions"],
      "note": {
        "title": "Server Actions は mutation 境界に置く",
        "noteType": "other",
        "bodyMd": "## 学んだこと\n\nServer Actions はフォーム送信や DB 更新の境界として使う。入力値は Zod で検証し、成功後は `revalidatePath` と `redirect` で画面を更新する。\n\n## まだ曖昧な点\n\n- 複数 mutation を transaction にまとめる基準\n- 失敗時に UI に返す error state の設計"
      },
      "questions": [
        {
          "title": "Server Action で入力値検証をどこに置く？",
          "questionMd": "Server Action で DB insert/update する前に何を行うべきか？",
          "answerMd": "FormData から値を読み取り、Zod schema で検証してから DB を更新する。",
          "explanationMd": "DB 境界の直前で検証すると、UI 側の実装差分に依存せず不正な値を止められる。成功後は必要な path を revalidate して redirect する。",
          "difficulty": "medium",
          "status": "draft"
        }
      ]
    },
    {
      "sourceKeys": ["chatgpt-conversation"],
      "note": {
        "title": "revalidatePath は mutation 後の表示更新に使う",
        "noteType": "other",
        "bodyMd": "## 学んだこと\n\nDB 更新後に一覧や詳細画面の表示を最新化したい場合は、Server Action 内で関連 path を `revalidatePath` する。\n\n## 注意点\n\n更新したデータが表示される path を漏らさない。"
      },
      "questions": [
        {
          "title": "mutation 後に Next.js の画面を最新化するには？",
          "questionMd": "Server Action で DB を更新した後、関連画面を最新化するために何を呼ぶべきか？",
          "answerMd": "`revalidatePath` で関連する path を再検証する。",
          "explanationMd": "一覧と詳細のように複数画面が同じデータを表示する場合は、必要な path をそれぞれ revalidate する。",
          "difficulty": "easy",
          "status": "draft"
        }
      ]
    }
  ]
}
```

## Import Behavior

- `sources[]` から Resource を作る
- `items[]` から Learning Note を作る
- `items[].sourceKeys` の先頭 Resource は `learning_notes.resource_id` に保存する
- `items[].sourceKeys` の全 Resource は `entity_links.relation_type = "references_resource"` で Learning Note に関連付ける
- `items[].questions[]` は Question Card draft として作る
- 同じ item から作成した Learning Note と Question Card は `entity_links.relation_type = "derived_question"` で関連付ける
- 1件の note だけ import した場合は note detail に戻り、複数 note の場合は `/notes` に戻る
