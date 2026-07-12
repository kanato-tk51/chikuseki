# chikuseki Product Roadmap

## 目的

このロードマップは、現在の実装状態を起点に、chikuseki を毎日使える個人用 Engineering Learning OS へ育てるための実装順を定める。

当面は、知識を蓄積し、Knowledge Map 上でつなぎ、復習し、実務や発信へ再利用するループを優先する。

Code Problem、コードエディタ、コード実行、Go / Rust Runner などのコード学習機能は重要だが、既存の知識学習ループが安定してから着手する。

## 現在地

以下は実装済み。

- Resource / Learning Note / Question Card の CRUD と検索
- Resource、Note、Question 間の関連付け
- ChatGPT JSON import
- Question Card の復習キューと簡易 spaced repetition
- 14 Domain、1,802 Node の Knowledge Map
- Knowledge Map の検索、理解状態、関連 Node 表示
- 外部テキストや既存データから候補を出す Knowledge Linker
- Resource / Note / Question と Knowledge Node のリンク保存・解除
- Knowledge Node からの Question draft 作成
- Knowledge Node と復習状態の接続

現在の中心導線は次の通り。

```text
Resource
  -> Learning Note
  -> Knowledge Node との接続
  -> Question draft
  -> Review queue
  -> Review result
  -> Knowledge Map に学習状態を還元
```

## 実装原則

- 新しい機能領域を増やす前に、既存の中心導線を自動テストで保護する。
- 毎日の利用に必要な導線を、管理機能や高度な自動化より優先する。
- ユーザーが確認する前に、AI生成結果を自動で active にしない。
- seed、ユーザーデータ、生成結果の出所を区別する。
- 個人の学習データを失わないよう、AI連携より先に backup / export を整備する。
- コード学習機能は独立した後期フェーズとして扱い、先行フェーズを妨げない。

## Phase 1: 品質基盤

目的は、現在動いている学習ループを壊れにくくすること。

### 実装するもの

- Vitest
- Playwright
- テスト専用 PostgreSQL
- fixture とテストデータ初期化
- GitHub Actions
- 復習スケジュール計算の unit test
- Knowledge Linker のスコアリング test
- ChatGPT import schema / validator test
- Resource から Review までの E2E test

最重要 E2E は、次の操作を一続きで保証する。

1. Resource を作成する
2. Resource から Note を作成する
3. Knowledge Node を候補生成して保存する
4. Question draft を作成する
5. Question を復習キューへ追加する
6. 今日の復習を実行する
7. review log と次回復習日を確認する
8. Knowledge Map へ学習状態が反映されることを確認する

### 完了条件

- `pnpm test` と `pnpm test:e2e` がローカルと CI で成功する
- fresh なテスト DB で中心導線を再現できる
- production DB のデータに依存せず検証できる

## Phase 2: 毎日の復習体験

目的は、アプリを開けば今日やることが分かり、復習結果を振り返れる状態にすること。

### 実装するもの

- `/reviews/history`
- 今後の復習予定と overdue 一覧
- 復習キューから外す操作
- archived Question のキュー制御
- 復習 memo の入力と表示
- 1問ずつ進める Review Session
- Domain / Knowledge Node / status / difficulty による絞り込み
- `again` / `hard` が多い Knowledge Node の表示
- Dashboard の実データ化

Dashboard には最低限、次を表示する。

- 今日の復習件数
- overdue 件数
- 最近追加した Resource / Note / Question
- 未編集の Question draft
- 復習が必要な Knowledge Node
- 最近更新した Project Log（Phase 4 完了後）

### 完了条件

- Dashboard から今日の復習を開始できる
- 復習履歴と次回予定を確認できる
- Knowledge Node 単位で苦手分野を把握できる

## Phase 3: 整理、検索、データ保全

目的は、増えた知識を探しやすくし、個人データを安全に保管できるようにすること。

### 実装するもの

- Tag CRUD
- Resource / Note / Question への Tag 付与
- タグ検索
- Tag、Domain、Knowledge Node、status、difficulty の複合フィルタ
- Markdown レンダリング
- コードブロック表示
- JSON backup / export
- JSON restore / import
- backup schema の version 管理

### 完了条件

- 主要エンティティを Tag と Knowledge Node の両方から検索できる
- すべての個人データを JSON として退避できる
- fresh DB に backup を復元できる
- backup / restore の往復を自動テストで保証できる

## Phase 4: Project、Concept、Output

目的は、知識を実務・個人開発・発信へ接続すること。

### 実装するもの

- Project CRUD
- Project Log CRUD
- Concept CRUD
- Output CRUD
- 各エンティティと Knowledge Node の関連付け
- Resource / Note / Question と Project / Concept / Output の関連付け
- Project ごとの学び、詰まり、解決策、意思決定の記録
- Output に再利用できる関連素材一覧

### 完了条件

- Project の作業から得た学びを Project Log と Note に残せる
- Project Log から Question を作成できる
- Knowledge Node から関連 Project / Log / Output を確認できる
- Output ごとに、根拠となる Resource / Note / Question を集約できる

## Phase 5: AI-assisted Capture

目的は、手動 import と同じデータ契約を使って、知識整理と問題化を支援すること。

### 実装するもの

- OpenAI Responses API
- Structured Outputs
- `chikuseki.chatgpt_import.v1` と互換性のある生成 schema
- Resource / Note / Question に対する AI Q&A
- AI回答を Learning Note として保存する操作
- Note / Resource / Project Log からの Question draft 生成
- Knowledge Node 候補を考慮した draft 生成
- 生成結果の確認・編集・採用フロー
- AI処理の失敗時に手動 import へ戻れる導線

### 完了条件

- AI生成結果が自動で active にならない
- 生成内容を確認してから保存できる
- 手動 import とアプリ内AIが同じ保存処理を利用する
- AIを無効にしても中心の学習ループを利用できる

## Phase 6: 再利用と発信支援

目的は、蓄積した知識を記事、登壇資料、README、ポートフォリオへ再利用すること。

### 実装するもの

- Knowledge Node / Tag / Project から素材を集める画面
- 技術記事のアウトライン作成
- 登壇資料のアウトライン作成
- 引用元 Resource と関連 Note の一覧
- Question を使った説明不足の発見
- Markdown export
- Output の公開状態と公開 URL 管理
- 静的な学習ログやポートフォリオ素材の出力

### 完了条件

- Project または Knowledge Node から記事・登壇資料の下書きを開始できる
- 出力内容から参照元の Resource / Note へ戻れる
- Markdown としてアプリ外へ持ち出せる

## Phase 7: 運用とプラットフォーム強化

目的は、データ量と機能が増えた後も安定して運用できるようにすること。

### 実装候補

- PostgreSQL full-text search
- URL metadata fetcher
- background job / queue
- OpenAPI による API 境界の明文化
- Next.js 内の一部処理を Go API へ分離
- observability、構造化ログ、エラー追跡
- backup の定期実行
- データ整合性チェック

Go API 化は学習目的だけで行わず、API境界、非同期処理、運用上の必要性が明確になった段階で着手する。

## Deferred: コード学習

コード学習機能は、Phase 1 から Phase 7 の主要導線が安定した後に着手する。

### 対象

- Code Problem CRUD
- Code Attempt 履歴
- CodeMirror または Monaco Editor
- `/code-problems/:id/solve`
- starter code / answer / reference solution / explanation
- Code Problem の復習キュー統合
- TypeScript / JavaScript のコード実行
- test case と実行結果の保存
- 隔離された Go / Rust Runner
- timeout、memory limit、network、filesystem 制限
- Rust CLI / Worker

### 着手条件

- 中心の知識学習 E2E が CI で安定している
- Review、Tag、backup / restore が完成している
- Project / Project Log / Output の再利用ループが動いている
- Code Problem に求める利用シナリオと保存データが明確になっている

## 当面扱わないもの

- 複数ユーザー対応
- 課金
- チーム機能
- 詳細な権限管理
- 外部公開サービス向けのUI
- 本格的なオンラインジャッジ

必要性が発生した場合は、このロードマップに新しい Phase と完了条件を追加してから着手する。

## 直近の実装単位

次の実装は Phase 1 とする。

```text
Vitest
  + Playwright
  + test database
  + GitHub Actions
  + Resource -> Note -> Knowledge Link -> Question -> Review E2E
```

この実装が完了するまでは、新しいエンティティやAI機能を増やさない。
