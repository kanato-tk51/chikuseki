# ADR 0001: 初期技術選定

- ステータス: 採用
- 日付: 2026-07-04

## 背景

このリポジトリでは、自分専用の Engineering Learning OS を作る。

このプロダクトの目的は、学習素材を保存するだけではない。TypeScript、Go、Rust、DB 設計、テスト、エディタ組み込み、将来のコード実行基盤の設計を、実装経験として積むことも目的に含める。

MVP では、まず次の学習ループをできるだけ早く使える状態にする。

1. 学習元になる Resource を保存する。
2. Resource から Learning Note を書く。
3. Learning Note を Question Card に変換する。
4. `/reviews/today` で Question Card を復習する。
5. 復習結果を保存する。

このプロダクトは個人利用を前提にする。複数ユーザー、課金、チーム権限、AI 生成、本格的なオンラインジャッジ、外部公開向け機能は MVP には含めない。

## 判断基準

- 最初の実装を、完成させて日常利用できる大きさに抑える。
- 学習に有用な実装面を、早すぎる抽象化で隠さない。
- TypeScript からも将来の Go サービスからも理解しやすい DB schema にする。
- Resource -> Note -> Question -> Review のループに直接効かないインフラを早期導入しない。
- 将来の Code Problem、runner service、Go API、Rust CLI を追加しても、初期データモデルを壊さずに済む構成にする。
- 利用実績があり、ドキュメントとエコシステムが十分にある技術を選ぶ。

## 決定

### アプリケーションフレームワーク

`Next.js App Router` と `TypeScript` を採用する。

理由:

- Server Components は、DB から読み込む一覧画面や詳細画面のデフォルトとして相性がよい。
- Server Actions は、アプリ内部の CRUD フォーム更新に向いている。
- Route Handlers は、外部 API 境界、JSON export、webhook、将来 Go API に移す可能性がある部分に限定して使える。
- フロントエンドと API サーバーを最初から分けるより、TypeScript の full-stack アプリとして始める方が MVP を小さくできる。

検討した代替案:

- `Vite + React + separate API`
  - 長所: API 境界が明確で、フロントエンドの考え方は単純になる。
  - 短所: 最初から backend service が必要になり、最初の学習ループを使えるまでが遅くなる。
- `Pages Router`
  - 長所: 古くからある Next.js のモデルで、既存知識が多い。
  - 短所: 新規 Next.js アプリで最適化する方向性としては App Router の方が自然。

実装方針:

- Server Components をデフォルトにする。
- Client Components は必要な箇所までできるだけ下げる。
- Server Actions は薄く保つ。validation や mutation の実体は page component に直接書かず、feature 単位の module に寄せる。
- Route Handlers は HTTP API 境界が実際に必要な場合だけ使う。

### パッケージマネージャー

`pnpm` を採用する。

理由:

- install が効率的で、disk 使用量も抑えやすい。
- 将来、Next.js app、Go service、Rust CLI、shared package を含む workspace 構成に移行しやすい。

検討した代替案:

- `npm`
  - 長所: 標準的で、追加の前提が少ない。
  - 短所: workspace の使い勝手や install 効率では pnpm に劣る場面がある。
- `yarn`
  - 長所: 成熟した ecosystem がある。
  - 短所: このプロジェクトでは pnpm を超える明確な利点が少ない。
- `bun`
  - 長所: runtime と package manager が高速。
  - 短所: MVP には不要な runtime / tooling の差分が増える。

### データベース

`PostgreSQL` を採用する。

理由:

- Resource、Note、Question、Review、Tag、entity link のような関係性のあるデータを扱いやすい。
- 最初は単純な `ILIKE` 検索で始め、後から full-text search や trigram search に進める。
- TypeScript からも将来の Go からも扱いやすく、DB 選定を途中で変えずに済む。
- migration、index、運用面の実績が十分にある。

検討した代替案:

- `SQLite`
  - 長所: local setup が最も簡単。
  - 短所: 将来の service 境界、review scheduling、runner data、backend 学習の目的とは PostgreSQL の方が合う。
- document database
  - 長所: note のような柔軟なデータ形状を扱いやすい。
  - 短所: このプロダクトでは entity 間の関連が中心になるため、relational model の方が product と学習目的の両方に合う。

### ORM と migration

`Drizzle ORM` を採用する。

理由:

- TypeScript で type-safe な query を書きつつ、SQL に近い形を保てる。
- schema 定義から生成される SQL migration が読みやすい。
- DB 設計を学ぶ目的に対して、過度に重い抽象で隠しすぎない。
- 将来 Go 側から同じ PostgreSQL schema を触るときに、TypeScript ORM の前提を持ち込みにくい。

検討した代替案:

- `Prisma`
  - 長所: developer experience が非常に良い。generated client、Prisma Studio、CRUD 開発速度が強い。
  - 短所: DB に対する抽象が強く、SQL / schema / migration 設計を練習する目的とはややズレる。
- raw SQL のみ
  - 長所: 透明性と portability が最大。
  - 短所: 基本 CRUD や TypeScript の型付けで反復作業が増える。

実装方針:

- migration SQL を review しやすい状態に保つ。
- 後から Go で扱いにくくなる application-only な前提を DB schema に押し込みすぎない。
- 挙動上重要な箇所には、明示的な index と constraint を置く。

### UI stack

`Tailwind CSS` と `shadcn/ui` を採用する。

理由:

- Tailwind は、最初から独自 CSS architecture を設計しなくても素早く UI を作れる。
- shadcn/ui は、accessible で composable な component source をリポジトリ内に持てる。
- このアプリは internal productivity tool なので、marketing 風の UI より、密度が高く一貫した CRUD / review 画面が重要。

検討した代替案:

- `Tailwind only`
  - 長所: dependency が少なく、制御しやすい。
  - 短所: button、dialog、table、form control などを毎回作ると一貫性が崩れやすい。
- `Radix UI` を直接使う
  - 長所: accessibility primitive が強い。
  - 短所: 各 component の見た目と composition を自分で組む作業が増える。
- MUI や Chakra のような full component library
  - 長所: 最初から多くの component が揃っている。
  - 短所: design system への依存が大きくなり、component source を直接所有しにくい。

実装方針:

- button、input、textarea、table、dialog、badge、tabs、sheet、alert などは shadcn primitives を優先する。
- UI は密度が高く、作業に集中しやすい方向にする。
- 日常の workflow に不要な landing page、card の入れ子、装飾的な layout は避ける。

### validation

`Zod` を採用する。

理由:

- runtime validation と TypeScript の型推論を同じ schema から得られる。
- Server Action と Route Handler の境界で使いやすい。
- DB write の前に明示的な validation を置ける。

検討した代替案:

- manual validation
  - 長所: dependency が増えない。
  - 短所: 反復作業が増え、TypeScript type との drift が起きやすい。
- その他の schema library
  - 長所: より高速なものや関数型寄りのものもある。
  - 短所: このアプリでは mainstream で十分な機能を持つ Zod が適している。

### form

最初は native form と Server Actions で始める。form state が複雑になった画面だけ `React Hook Form` を追加する。

理由:

- 最初の CRUD 画面は単純な form submission で十分。
- 必要になる前に client-side form machinery を導入しない。
- dynamic fields、複雑な client validation、autosave、rich editor workflow が必要になったら React Hook Form は有力な選択肢として残せる。

検討した代替案:

- 最初から全画面で `React Hook Form` を使う
  - 長所: form abstraction が統一され、複雑な form state を扱いやすい。
  - 短所: 初期の Resource、Note、Question、Review form には過剰。

### Markdown

編集は `textarea`、preview は `react-markdown` で始める。

理由:

- Markdown は plain text の保存形式として保つ。
- MVP では rich editing experience より、確実に保存して preview できることが重要。
- 書き心地が実際の障害になってから rich editor を導入すればよい。

検討した代替案:

- `MDXEditor`、`Milkdown`、`TipTap`
  - 長所: 編集体験が良く、rich interaction を作れる。
  - 短所: editor integration 自体が大きな作業になり、学習ループの実装から逸れやすい。

### code editor

Phase 3 で `CodeMirror` を採用する。

理由:

- Monaco より軽く、Code Problem の focused workflow に組み込みやすい。
- syntax highlight、starter code、answer、reference solution の編集には十分。
- 後から lint や language-specific extension を足しやすい。

検討した代替案:

- `Monaco Editor`
  - 長所: VS Code に近い browser editor 体験を作れる。
  - 短所: 重く、worker や bundling の調整が増える。Code Problem solving の前には不要。
- plain `textarea`
  - 長所: 最も簡単。
  - 短所: code editing が中心 workflow になった時点では弱すぎる。

### search

最初は PostgreSQL の `ILIKE` による title / body search と、tag / concept filter で始める。実データが溜まってから PostgreSQL full-text search や trigram search を再検討する。

理由:

- 初期データ量は小さい。
- 発見性は tag、concept、entity link でもかなり担える。
- 必要になる前に別 search service を運用しない。

検討した代替案:

- 最初から PostgreSQL full-text search を使う
  - 長所: 単純な `ILIKE` より ranking や query support が強い。
  - 短所: 実際の検索行動が見える前に設計しても premature になりやすい。
- `Meilisearch`
  - 長所: full-text search UX と typo tolerance が強い。
  - 短所: 追加の service 運用が必要になり、MVP には過剰。

### test

focused な unit test には `Vitest`、重要な user loop には `Playwright` を採用する。

理由:

- review scheduling や validation logic は高速な unit test と相性がよい。
- この product の本当のリスクは vertical workflow が壊れることなので、Resource -> Note -> Question -> Review は Playwright で守る。

検討した代替案:

- unit test のみ
  - 長所: 高速で実行しやすい。
  - 短所: 実際の app workflow を守れない。
- E2E test のみ
  - 長所: user-visible な confidence が高い。
  - 短所: 遅く、純粋な logic の検証には精度が低い。

### local development

PostgreSQL と local service dependencies には `Docker Compose` を使う。

理由:

- DB setup の再現性を保てる。
- 後から Go API、runner service、queue、search service を足しやすい。

検討した代替案:

- local に native PostgreSQL を install する
  - 長所: すでに入っていれば簡単。
  - 短所: machine 間で setup が揃いにくい。
- 最初から managed cloud database を使う
  - 長所: production に近い。
  - 短所: personal local-first MVP には不要な外部依存になる。

## 初期実装スコープ

すべての CRUD 画面を先に作るのではなく、最初の vertical slice を先に作る。

1. Next.js を TypeScript、Tailwind、linting 付きで scaffold する。
2. shadcn/ui を追加する。
3. PostgreSQL 用の Docker Compose を追加する。
4. Drizzle schema と migrations を追加する。
5. 最初の table を実装する。
   - `resources`
   - `learning_notes`
   - `question_cards`
   - `review_items`
   - `review_logs`
   - `tags`
   - `entity_tags`
   - `entity_links`
6. 最初の route を実装する。
   - `/resources`
   - `/notes`
   - `/questions`
   - `/reviews/today`
7. 最初の loop を検証する。
   - Resource -> Learning Note -> Question Card -> Review Item -> Review Log

`code_problems`、`projects`、`concepts`、`outputs` は MVP 計画には残すが、最初の review loop が使えるようになってから追加する。

## 影響

良い影響:

- 最初の version を小さく作り、早く使い始められる。
- stack がこのプロダクトの学習目的に合う。
- SQL と schema 設計が見えやすい。
- 将来の Go API と Rust CLI が同じ PostgreSQL data model を共有しやすい。
- UI stack は生産性を上げつつ、component 実装を隠しすぎない。

悪い影響:

- Drizzle は Prisma より DB 設計の discipline が必要。
- 個人用アプリでも、Server Actions には validation と authorization の習慣が必要。
- Markdown と code editing は意図的に簡素な状態から始める。
- search quality は、実利用から必要性が見えるまでは基本的なものに留まる。

## 見直し条件

次のいずれかが起きたら、この技術選定を見直す。

- CRUD 開発速度が主な bottleneck になり、DB 学習の優先度が下がった。
- search quality が日常利用を妨げる。
- Markdown の書き心地が日常利用を妨げる。
- Code Problem solving が中心 workflow になり、Monaco やより深い editor tooling を正当化できる。
- Go API が main backend になり、Next.js を frontend-only にした方がよくなった。
- project が personal local-first から hosted multi-user use に移行した。
