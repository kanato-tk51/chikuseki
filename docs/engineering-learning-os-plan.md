# Engineering Learning OS 実装計画

## 目的

このプロダクトは、自分専用の Engineering Learning OS として、TypeScript、Go、Rust の実装力を高めるための学習・開発・登壇・発信の知識を蓄積し、復習し、再利用できるようにする。

主な学習ループは次の通り。

1. 記事、書籍、登壇資料、仕事、個人開発から学ぶ
2. Resource や Learning Note として保存する
3. 重要な内容を Question Card や Code Problem に変換する
4. アプリ内で復習する
5. コード問題を解き、実行結果や間違いを保存する
6. 学びを Project Log に残す
7. 後で登壇資料や技術記事に再利用する

ブラウザ版 ChatGPT や OpenAI API で得た知見も同じループに入れる。外部の ChatGPT で得た回答は、まずアプリが受け取れる JSON template に変換して import する。アプリ内の OpenAI API 連携は、その template と同じ schema を使って Learning Note と Question Card を生成する。

個人利用を前提とし、最初から一般ユーザー向けの作り込み、課金、チーム機能、細かい権限管理は扱わない。

## 開発方針

- 仕様や設計の相談
- 技術選定の壁打ち
- 実装計画の整理
- DB 設計や API 設計のレビュー観点整理
- 詰まったときの原因切り分け
- 学習内容の言語化や復習用問題への変換

## MVP スコープ

MVP では「蓄積する」「問題化する」「今日復習する」までを最短で作る。

### MVP で入れるもの

- Resource の CRUD
- Learning Note の CRUD
- Question Card の CRUD
- Code Problem の CRUD
- Project / Project Log の CRUD
- Concept の CRUD
- Output の CRUD
- Tag とタグ検索
- 各エンティティ間の関連付け
- `/reviews/today` で今日復習する Question Card / Code Problem を表示
- 復習結果の記録
- ChatGPT 出力を貼り付けて Learning Note / Question Card に import する
- ChatGPT 用の登録プロンプトと JSON template
- Markdown 本文、コードブロック、URL 保存
- Code Problem の問題文、starter code、自分の回答、模範解答、解説の保存

### MVP でやらないもの

- 複数ユーザー
- 課金
- チーム機能
- 詳細な権限管理
- Go / Rust のコード実行
- 本格的なオンラインジャッジ
- OpenAI API によるアプリ内 AI チャット、Question 自動生成、要約生成
- 高度な全文検索
- 外部公開向け UI

## フェーズごとの実装計画

### Phase 1: TypeScript MVP

目的は、毎日使える知識蓄積アプリを作ること。

- Next.js アプリを作成する
- PostgreSQL と ORM を設定する
- 基本レイアウトとナビゲーションを作る
- Resource / Learning Note / Question Card / Code Problem / Project / Output / Concept の CRUD を作る
- Tag と関連付けを作る
- 今日の復習画面を作る
- ChatGPT import 用の prompt / JSON template / import UI を作る
- 最低限の JSON backup / export を作る

### Phase 1.5: AI-assisted Capture

目的は、外部 ChatGPT とアプリ内 OpenAI API 生成の出力形式を揃え、知識を Learning Note と Question Card に変換しやすくすること。

- ChatGPT で使う登録プロンプトを用意する
- `chikuseki.chatgpt_import.v1` の JSON schema を Zod で定義する
- JSON を貼り付けて Resource / Learning Note / Question Card に import する
- import した Learning Note と Question Card を `entity_links` で関連付ける
- 後続の OpenAI API 連携では Responses API の structured output を使い、同じ schema を返させる
- Question / Note に対する AI Q&A を作る
- AI 回答を Learning Note として保存する
- AI 回答や Note から Question Card draft を生成する

### Phase 2: 復習機能

目的は、Question Card と Code Problem を継続的に復習できる状態にすること。

- `review_items` / `review_logs` を整備する
- `next_review_at` を管理する
- `again` / `hard` / `good` / `easy` のような復習結果を保存する
- タグ別、Concept 別の復習対象絞り込みを作る
- 簡易 spaced repetition を導入する

### Phase 3: コードエディタ

目的は、Code Problem をアプリ内で解ける状態にすること。

- CodeMirror または Monaco Editor を導入する
- 言語ごとの syntax highlight を行う
- starter code / answer / reference solution を編集できるようにする
- `/code-problems/:id/solve` を作る
- attempt 履歴を保存する

### Phase 4: TypeScript / JavaScript 実行

目的は、まず TypeScript / JavaScript の問題だけアプリ内で試せるようにすること。

- ブラウザ内実行、Sandpack、WebContainers、Deno などを比較する
- 実行対象は TypeScript / JavaScript に絞る
- stdout、stderr、error、実行時間を保存できる形にする
- 実行結果を `code_run_results` に保存する

### Phase 5: Go API 化

目的は、バックエンド設計と Go の実装力を伸ばしつつ、API 境界を明確にすること。

- Next.js API の一部を Go に移行する
- OpenAPI 定義を作る
- PostgreSQL アクセスを Go で実装する
- Resource API、Note API、Question API、CodeProblem API を検討する
- Review scheduler を実装する
- URL metadata fetcher を実装する
- job queue の下地を作る

### Phase 6: Go / Rust Runner

目的は、Go / Rust のコードを隔離された環境で実行できるようにすること。

- Judge0 / Piston / Docker runner を比較する
- timeout、memory limit、network off、filesystem 制限を設計する
- compile error / runtime error / stdout / stderr を保存する
- runner service をアプリ本体から分離する

### Phase 7: Rust CLI / Worker

目的は、Rust でローカル操作や高速処理を担う `learnctl` のような CLI を作ること。

- Markdown import / export
- JSON backup
- 問題データの lint
- ローカル検索
- 登壇資料用 Markdown 生成
- 学習ログの静的出力

### Phase 8: 発信・登壇支援

目的は、蓄積した知識を Output に再利用しやすくすること。

- Output に関連する Resource、Note、Question、CodeProblem、ProjectLog を紐づける
- タグや Concept から登壇資料のアウトラインを作る
- 技術記事の下書きを作る
- README やポートフォリオへの再利用導線を作る

## 初期データモデル案

### `resources`

記事、書籍、登壇資料、動画、公式 Docs、GitHub リポジトリ、自分の登壇資料など、学習元になるものを保存する。

- `id`
- `type`
- `title`
- `url`
- `source_name`
- `author`
- `summary`
- `memo`
- `published_at`
- `consumed_at`
- `created_at`
- `updated_at`

### `learning_notes`

Resource、仕事、個人開発、このプロダクト開発などから学んだことを保存する。

- `id`
- `title`
- `body_md`
- `note_type`
- `resource_id`
- `project_id`
- `concept_id`
- `created_at`
- `updated_at`

### `question_cards`

1 問 1 答形式の問題、回答、解説を保存する。

- `id`
- `title`
- `question_md`
- `answer_md`
- `explanation_md`
- `difficulty`
- `status`
- `created_at`
- `updated_at`

### `code_problems`

コード問題、問題文、starter code、模範解答、解説を保存する。

- `id`
- `title`
- `language`
- `problem_md`
- `starter_code`
- `reference_solution`
- `explanation_md`
- `difficulty`
- `status`
- `created_at`
- `updated_at`

### `code_attempts`

Code Problem に対する自分の回答履歴を保存する。

- `id`
- `code_problem_id`
- `answer_code`
- `memo`
- `created_at`
- `updated_at`

### `projects`

仕事、個人開発、学習プロジェクト、このプロダクト開発などを保存する。

- `id`
- `name`
- `type`
- `description_md`
- `status`
- `created_at`
- `updated_at`

### `project_logs`

Project に紐づく学び、詰まり、解決策を保存する。

- `id`
- `project_id`
- `title`
- `body_md`
- `log_type`
- `created_at`
- `updated_at`

### `concepts`

Ownership、goroutine、TypeScript の型設計、DB transaction、API design など、技術概念を保存する。

- `id`
- `name`
- `slug`
- `description_md`
- `parent_concept_id`
- `created_at`
- `updated_at`

### `outputs`

自分の登壇資料、技術記事、GitHub リポジトリ、README、ポートフォリオなどを保存する。

- `id`
- `type`
- `title`
- `url`
- `body_md`
- `published_at`
- `created_at`
- `updated_at`

### `tags`

タグを保存する。

- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### `entity_tags`

任意のエンティティと Tag を紐づける。

- `id`
- `entity_type`
- `entity_id`
- `tag_id`
- `created_at`

### `entity_links`

任意のエンティティ同士の関連を保存する。

- `id`
- `from_type`
- `from_id`
- `to_type`
- `to_id`
- `relation_type`
- `created_at`

### `review_items`

復習対象を保存する。MVP では Question Card と Code Problem を対象にする。

- `id`
- `target_type`
- `target_id`
- `next_review_at`
- `interval_days`
- `ease`
- `last_result`
- `created_at`
- `updated_at`

### `review_logs`

復習履歴を保存する。

- `id`
- `review_item_id`
- `result`
- `memo`
- `reviewed_at`
- `created_at`

### 将来のコード実行用テーブル

MVP では実装しないが、Code Problem に実行結果を直接持たせない方針にする。

#### `test_cases`

- `id`
- `code_problem_id`
- `name`
- `input`
- `expected_output`
- `is_hidden`
- `created_at`
- `updated_at`

#### `code_runs`

- `id`
- `code_problem_id`
- `code_attempt_id`
- `language`
- `runtime`
- `status`
- `queued_at`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

#### `code_run_results`

- `id`
- `code_run_id`
- `stdout`
- `stderr`
- `exit_code`
- `compile_error`
- `runtime_error`
- `timed_out`
- `duration_ms`
- `memory_kb`
- `created_at`

## 初期画面構成案

### Dashboard

- `/`
- 今日の復習
- 最近追加した Learning Note
- 最近の Project Log
- 最近作成した Question Card / Code Problem

### Resources

- `/resources`
- `/resources/new`
- `/resources/:id`
- `/resources/:id/edit`

### Learning Notes

- `/notes`
- `/notes/new`
- `/notes/:id`
- `/notes/:id/edit`

### Question Cards

- `/questions`
- `/questions/new`
- `/questions/:id`
- `/questions/:id/edit`

### Code Problems

- `/code-problems`
- `/code-problems/new`
- `/code-problems/:id`
- `/code-problems/:id/edit`
- `/code-problems/:id/solve`

### Reviews

- `/reviews/today`
- `/reviews/history`

### Imports

- `/imports/chatgpt`

### Projects

- `/projects`
- `/projects/new`
- `/projects/:id`
- `/projects/:id/edit`
- `/projects/:id/logs/new`

### Outputs

- `/outputs`
- `/outputs/new`
- `/outputs/:id`
- `/outputs/:id/edit`

### Concepts

- `/concepts`
- `/concepts/new`
- `/concepts/:id`
- `/concepts/:id/edit`

### Tags

- `/tags/:slug`

## 技術選定で検討すべき選択肢

### アプリケーション

第一候補:

- Next.js
- TypeScript
- React

検討ポイント:

- App Router を前提にするか
- Server Actions をどこまで使うか
- API routes をどこまで作るか
- 将来 Go API に移しやすい境界にするか

### DB / ORM

候補:

- PostgreSQL
- Prisma
- Drizzle

検討ポイント:

- 型安全性
- migration の扱いやすさ
- SQL の見通し
- 将来 Go API から同じ DB を扱う前提で過度に ORM 依存しないこと

### UI

候補:

- Tailwind CSS
- shadcn/ui
- Radix UI

検討ポイント:

- 個人用ツールとして密度の高い UI にする
- CRUD 画面を高速に作れること
- フォーム、ダイアログ、タブ、テーブルが扱いやすいこと

### Form / Validation

候補:

- React Hook Form
- Zod

検討ポイント:

- 入力値検証を DB/API 境界でも再利用できること
- Markdown やコードの長文入力が扱いやすいこと

### Markdown Editor

候補:

- textarea から開始
- react-markdown
- MDXEditor
- Milkdown
- TipTap

検討ポイント:

- MVP では textarea + preview で十分か
- Markdown の保存形式を素直に保つこと
- 後からエディタを差し替えやすいこと

### Code Editor

候補:

- CodeMirror
- Monaco Editor

検討ポイント:

- CodeMirror は軽量で組み込みやすい
- Monaco は IDE 体験に近いが重い
- Phase 3 では CodeMirror を第一候補にする

### Search

候補:

- MVP: PostgreSQL の `ILIKE`
- 次段階: PostgreSQL full-text search
- 将来: Meilisearch

検討ポイント:

- 最初から検索基盤を重くしない
- タグ、Concept、Project で絞り込めることを優先する

### AI / OpenAI API

候補:

- OpenAI Responses API
- Structured Outputs
- Zod schema

検討ポイント:

- アプリ内生成とブラウザ版 ChatGPT import の出力形式を揃える
- Note / Question 生成では JSON schema に従う structured output を使う
- OpenAI API key は server-side だけで扱う
- 生成結果は自動で active にせず、まず draft として保存する
- 生成後にユーザーが編集し、必要なものだけ Review queue に追加する
- API 失敗時でも手動 import で同じワークフローを維持できるようにする

### Test

候補:

- Vitest
- React Testing Library
- Playwright

検討ポイント:

- 最初は重要導線の E2E を優先する
- Resource -> Note -> Question -> Review の縦導線を守る

### Local Dev

候補:

- Docker Compose
- PostgreSQL
- pnpm

検討ポイント:

- ローカルで再現しやすいこと
- 将来 Go API / Runner Service を足しやすいこと

## 最初に作るべきタスクの順番

1. Next.js プロジェクトを初期化する
2. lint / format / test の最低限を設定する
3. Docker Compose で PostgreSQL を起動する
4. ORM を設定する
5. 初期 schema と migration を作る
6. 基本レイアウトとナビゲーションを作る
7. Resource CRUD を作る
8. Learning Note CRUD を作る
9. Resource から Learning Note を作れる導線を作る
10. Question Card CRUD を作る
11. Learning Note から Question Card を作れる導線を作る
12. Code Problem CRUD を作る
13. Code Problem の starter code / reference solution / explanation を保存できるようにする
14. Tag を作る
15. Tag 検索を作る
16. Project / Project Log を作る
17. Concept を作る
18. Output を作る
19. `review_items` / `review_logs` を作る
20. `/reviews/today` を作る
21. 復習結果を保存できるようにする
22. JSON export を作る
23. Resource -> Note -> Question / Code Problem -> Review の E2E テストを追加する

## 重くなりそうな点とリスク

### エンティティ間の関連が増えすぎる

Resource、Note、Question、CodeProblem、Project、Concept、Output は相互に関連しやすい。最初から個別の中間テーブルを大量に作ると設計が重くなる。

MVP では `entity_links` で柔らかく関連を表現し、必要になった関連だけ後から専用テーブル化する。

### Tag、Concept、Project、Output の役割が曖昧になる

- Tag: 横断的な分類
- Concept: 技術概念の整理
- Project: 実践や文脈
- Output: 外に出した成果物

この役割を UI 上でも分ける。

### Markdown エディタ選定に時間を使いすぎる

MVP では textarea + preview で始める。書き心地が問題になってから専用エディタを入れる。

### 復習アルゴリズムを凝りすぎる

MVP では単純な `again` / `hard` / `good` / `easy` と `next_review_at` で十分。アルゴリズムはデータが溜まってから調整する。

### Code Problem をオンラインジャッジ前提で作り込みすぎる

MVP では実行しない。問題、回答、模範解答、解説、attempt 履歴を保存できればよい。

### 仕事由来のメモに機密情報が混ざる

運用ルールとして、顧客名、内部 URL、未公開情報、具体的な障害情報は保存しない。抽象化された技術知見だけを保存する。

### 個人用なのに UI が肥大化する

管理画面を作り込みすぎない。最初は一覧、詳細、作成、編集、検索、復習に絞る。

## コード実行環境を後から入れやすくするための設計上の注意点

### Code Problem と実行結果を分離する

Code Problem に実行結果を直接持たせない。

- `code_problems`: 問題そのもの
- `code_attempts`: 自分の回答履歴
- `test_cases`: 将来のテストケース
- `code_runs`: 実行ジョブ
- `code_run_results`: 実行結果

この分離により、実行環境が変わっても問題データを壊さずに済む。

### 言語と runtime を分ける

`language` は TypeScript、JavaScript、Go、Rust などの言語を表す。`runtime` は Node.js、Deno、Go version、Rust toolchain などを表す。

MVP では `language` だけでもよいが、将来 `runtime` と `version` を追加できる形にしておく。

### 実行状態を明示する

将来の `code_runs.status` は次のような値を想定する。

- `queued`
- `running`
- `succeeded`
- `failed`
- `timeout`
- `compile_error`
- `runtime_error`
- `cancelled`

### Runner はアプリ本体から分離する

Next.js アプリから直接任意コードを実行しない。将来的には job queue を介して runner service に渡す。

想定構成:

1. App が `code_runs` を作成する
2. Worker / Runner が job を取得する
3. 隔離環境で実行する
4. `code_run_results` に結果を保存する
5. App が結果を表示する

### Go / Rust 実行は危険領域として扱う

最低限考慮する制限:

- timeout
- memory limit
- CPU limit
- network off
- filesystem 制限
- process 数制限
- output size limit
- image / dependency の管理

### Test case は公開 / 非公開を分けられるようにする

将来オンラインジャッジ化する場合、ユーザーに見せる sample test と、評価用 hidden test を分けられるようにする。

### 実行環境候補は段階的に評価する

TypeScript / JavaScript:

- browser sandbox
- Sandpack
- WebContainers
- Deno

Go / Rust:

- Judge0
- Piston
- Docker runner
- Firecracker 系の isolation

最初から最終形を決めず、Phase 4 で TS/JS、Phase 6 で Go/Rust を別々に評価する。

## 初期の設計方針

MVP は学習 OS として作る。Runner は別サービスとして後から足す。

Next.js アプリは知識管理、問題化、復習、関連付けに集中する。コード実行は疎結合にし、将来 Go API、Runner Service、Rust CLI を追加しても既存の学習データが壊れない構造にする。
