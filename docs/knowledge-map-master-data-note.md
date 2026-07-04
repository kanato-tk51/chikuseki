# Knowledge Map Master Data Memo

## 目的

chikuseki に、コンピュータサイエンス全般とプロダクト開発の知見を横断的に参照できるマスターデータを持たせる。

今の ChatGPT import は、既存の会話、記事、URL、生テキストから Resource / Learning Note / Question を作れる。一方で、その入力はユーザーがすでに知っている範囲に偏りやすい。そこで、プロダクト側に技術領域の地図を持たせ、未知の技術用語や周辺概念を見つけ、ChatGPT に質問する入口にする。

## 扱う範囲

プロダクト開発だけに閉じず、コンピュータサイエンス全般を扱う。

- Algorithms and Complexity
- Computer Architecture
- Operating Systems
- Computer Networks
- Databases and Data Management
- Distributed Systems
- Programming Languages
- Compilers
- Security and Cryptography
- Artificial Intelligence and Machine Learning
- Human-Computer Interaction
- Computer Graphics
- Software Engineering
- Product Engineering
- Web Application Development
- Operations and Observability
- Society, Ethics, and Law

`Software Engineering` や `Product Engineering` も同じマスターに含める。純粋な CS の概念と、実務上の設計判断や運用判断を別世界にしない。

例:

- `MVCC` は Database Systems の概念だが、予約管理、在庫引当、決済処理の同時実行制御とも関係する。
- `JWT` は Security / Cryptography / Web Application Development / Authentication にまたがる。
- `HTTP Cache` は Networks / Web Platform / Product Performance にまたがる。

## 推奨階層

基本は 5 階層にする。

```text
Domain
  Knowledge Area
    Topic Cluster
      Concept / Technique
        Term
```

### 1. Domain

最上位の大きな棚。10-20 個程度に抑える。

例:

- Theory
- Computer Systems
- Data Management
- Artificial Intelligence
- Security
- Software Engineering
- Product Engineering
- Human-Computer Interaction

### 2. Knowledge Area

大学の授業、専門書、研究領域、実務領域として成立する粒度。

例:

- Operating Systems
- Algorithms and Complexity
- Database Systems
- Computer Networks
- Cryptography
- Machine Learning
- Web Application Development
- SaaS Architecture

### 3. Topic Cluster

学習テーマとしてまとまりがあり、複数の概念や技術用語を束ねる粒度。

例:

- Concurrency
- Memory Management
- Query Optimization
- Transaction Processing
- API Design
- Authentication and Authorization
- Observability

### 4. Concept / Technique

Question 化しやすい概念、技法、設計判断の粒度。

例:

- Synchronization
- Virtual Memory
- Indexing
- Isolation and Consistency
- API Style Selection
- Authorization Models
- Distributed Tracing

### 5. Term

最下層。具体的な技術用語、アルゴリズム名、規格名、ライブラリ名、パターン名。

例:

- Mutex
- Semaphore
- Page Table
- B+ Tree
- MVCC
- Two-Phase Locking
- REST
- GraphQL
- tRPC
- RBAC
- ABAC
- OpenTelemetry
- Trace ID

## ツリーではなくグラフとして扱う

分類上は 5 階層を持つが、完全な木構造にはしない。

多くの技術用語は複数領域にまたがるため、主所属と横断リンクを分ける。

```ts
type KnowledgeNode = {
  id: string;
  slug: string;
  name: string;
  level:
    | "domain"
    | "knowledge_area"
    | "topic_cluster"
    | "concept"
    | "term";
  primaryParentId: string | null;
  summary: string;
  whyLearn: string;
  promptHint: string;
  curationStatus: "draft" | "reviewed" | "deprecated";
};
```

```ts
type KnowledgeEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType:
    | "related"
    | "prerequisite"
    | "compare_with"
    | "used_in"
    | "broader"
    | "narrower";
};
```

## 保持方法

マスターデータは、最初から DB だけを正にしない。

まずはリポジトリ内の seed file を正として持ち、DB はアプリで閲覧、検索、進捗管理するための投影先にする。

想定ディレクトリ:

```text
data/
  knowledge-map/
    domains.yaml
    theory.yaml
    computer-systems.yaml
    data-management.yaml
    security.yaml
    software-engineering.yaml
    product-engineering.yaml
```

DB 側の想定:

```text
knowledge_nodes
- id
- slug
- name
- level
- primary_parent_id
- summary
- why_learn
- prompt_hint
- sort_order
- curation_status
- created_at
- updated_at

knowledge_edges
- id
- from_node_id
- to_node_id
- relation_type

knowledge_aliases
- id
- node_id
- alias

knowledge_sources
- id
- title
- url
- source_type
- summary

knowledge_node_sources
- node_id
- source_id
```

ユーザー個人の学習状態はマスターとは分ける。

```text
knowledge_node_progress
- node_id
- status
- last_reviewed_at
- created_at
- updated_at
```

`status` の候補:

- `unknown`
- `interested`
- `learning`
- `understood`
- `ignored`

## Deep Research を使った作成方針

一括生成は避ける。

CS 全般とプロダクト開発を一度に作らせると、分類が浅くなり、粒度が揃わず、重複も増える。Deep Research は広い調査に使えるが、品質を上げるには範囲を切って依頼する。

進め方:

1. 全体スケルトンを作る
   - `Domain -> Knowledge Area` まで
2. Domain ごとに Deep Research する
   - 例: Computer Systems、Data Management、Security、Software Engineering
3. Knowledge Area ごとに下位分類を作る
   - `Topic Cluster -> Concept -> Term`
4. 人間が粒度、重複、命名をレビューする
5. YAML / JSON seed として保存する
6. DB に同期する
7. アプリでツリー表示、検索、関連語表示を行う

## アプリ上の使い方

最初の実装では、Knowledge Map は学習の入口として使う。

- Domain / Knowledge Area から未知の領域を眺める
- Topic Cluster から重要概念を把握する
- Term を見て、気になるものを ChatGPT に質問する
- ChatGPT の回答を Source Prompt または Conversation Prompt 経由で Resource / Note / Question に import する
- import した Note / Question を Knowledge Node と関連付ける

将来的には、Knowledge Node ごとに次の情報を見られるようにする。

- 関連 Resource
- 関連 Learning Note
- 関連 Question
- 理解ステータス
- 関連用語
- 前提知識
- 比較対象
- ChatGPT に聞くための prompt hint

## 初期実装でやらないこと

- 完璧な CS taxonomy を一気に作る
- すべての技術用語を網羅する
- 自動で正誤判定する
- Deep Research の結果を無検証で DB に直接投入する
- ユーザーごとに複雑なカリキュラム最適化を行う

まずは、seed file で小さく始める。

候補:

- Software Engineering
- Product Engineering
- Data Management
- Security
- Computer Systems

この範囲から作り、実際に ChatGPT import、Note、Question、Review と接続できるかを確認する。
