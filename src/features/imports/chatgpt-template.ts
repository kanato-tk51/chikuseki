import type { ChatGptImportPayload } from "@/features/imports/validators";

export const chatGptImportPayloadVersion = "chikuseki.chatgpt_import.v1";

export const chatGptImportSample: ChatGptImportPayload = {
  version: chatGptImportPayloadVersion,
  source: {
    title: "ChatGPT conversation: Next.js Server Actions",
    type: "other",
    url: null,
    sourceName: "ChatGPT",
    author: null,
    summary: "Server Actions の validation と redirect/revalidate の整理。",
    memo: "ブラウザ版 ChatGPT で得た知見を chikuseki に取り込むための例。",
  },
  note: {
    title: "Server Actions は mutation 境界に置く",
    noteType: "other",
    bodyMd:
      "## 学んだこと\n\nServer Actions はフォーム送信や DB 更新の境界として使う。入力値は Zod で検証し、成功後は `revalidatePath` と `redirect` で画面を更新する。\n\n## まだ曖昧な点\n\n- 複数 mutation を transaction にまとめる基準\n- 失敗時に UI に返す error state の設計",
  },
  questions: [
    {
      title: "Server Action で入力値検証をどこに置く？",
      questionMd: "Server Action で DB insert/update する前に何を行うべきか？",
      answerMd: "FormData から値を読み取り、Zod schema で検証してから DB を更新する。",
      explanationMd:
        "DB 境界の直前で検証すると、UI 側の実装差分に依存せず不正な値を止められる。成功後は必要な path を revalidate して redirect する。",
      difficulty: "medium",
      status: "draft",
    },
  ],
};

export const chatGptImportTemplate = JSON.stringify(
  chatGptImportSample,
  null,
  2,
);

export const chatGptImportPrompt = `あなたは、会話から学習用のノートと復習問題を抽出するアシスタントです。

この会話で得た知見から、後で復習できる学習ノートと復習用 Question を作ってください。
追加で貼り付けた説明・コード・メモがある場合は、それも含めてください。

要件:
- 出力は JSON のみ。Markdown のコードフェンスや説明文は付けない
- JSON template と同じ構造・フィールド名で出力する
- source は、元になった記事・会話・URL がある場合だけ埋める。なければ null
- note.bodyMd には、学んだこと、背景、注意点、まだ曖昧な点を Markdown でまとめる
- questions は 1 問 1 答にする
- questionMd は「何を思い出すべきか」が明確な問いにする
- answerMd は短く正確にする
- explanationMd は判断理由、落とし穴、関連知識を書く
- difficulty は easy / medium / hard のいずれか
- status は draft にする
- 不明なことを断定しない
- 学習ノートとして残すには情報が不十分なら、note.bodyMd に不足点を明記し、questions は空配列にする

JSON template:
${chatGptImportTemplate}

追加で取り込みたいメモや本文がある場合は、このメッセージの後に貼り付けてください。
ない場合は、この会話だけを対象にしてください。
`;
