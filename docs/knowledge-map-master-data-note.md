# Knowledge Map Master Data Memo

## 目的

chikuseki に、コンピュータサイエンス全般とプロダクト開発の知見を横断的に参照できるマスターデータを持たせる。

今の ChatGPT import は、既存の会話、記事、URL、生テキストから Resource / Learning Note / Question を作れる。一方で、その入力はユーザーがすでに知っている範囲に偏りやすい。そこで、プロダクト側に技術領域の地図を持たせ、未知の技術用語や周辺概念を見つけ、ChatGPT に質問する入口にする。

## 扱う範囲

プロダクト開発だけに閉じず、コンピュータサイエンス全般を扱う。

- アルゴリズムと計算量
- コンピュータアーキテクチャ
- オペレーティングシステム
- コンピュータネットワーク
- データベースとデータ管理
- 分散システム
- プログラミング言語
- コンパイラ
- セキュリティと暗号
- 人工知能と機械学習
- HCI / Human-Computer Interaction
- コンピュータグラフィックス
- ソフトウェア工学
- プロダクトエンジニアリング
- Webアプリケーション開発
- 運用とObservability
- 社会、倫理、法律

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

- 理論
- コンピュータシステム
- データ管理
- 人工知能
- セキュリティ
- ソフトウェア工学
- プロダクトエンジニアリング
- HCI / Human-Computer Interaction

### 2. Knowledge Area

大学の授業、専門書、研究領域、実務領域として成立する粒度。

例:

- オペレーティングシステム
- アルゴリズムと計算量
- データベースシステム
- コンピュータネットワーク
- 暗号
- 機械学習
- Webアプリケーション開発
- SaaSアーキテクチャ

### 3. Topic Cluster

学習テーマとしてまとまりがあり、複数の概念や技術用語を束ねる粒度。

例:

- 並行性
- メモリ管理
- クエリ最適化
- トランザクション処理
- API設計
- 認証と認可
- Observability

### 4. Concept / Technique

Question 化しやすい概念、技法、設計判断の粒度。

例:

- 同期
- 仮想メモリ
- インデックス設計
- 分離性と一貫性
- API方式選定
- 認可モデル
- 分散トレーシング

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
  aliases?: string[];
  search?: KnowledgeNodeSearchMetadata;
  curationStatus: "draft" | "reviewed" | "deprecated";
};

type KnowledgeNodeSearchMetadata = {
  keywords?: string[];
  relatedNames?: KnowledgeRelatedName[];
  commonSignals?: string[];
  antiSignals?: string[];
};

type KnowledgeRelatedName = {
  name: string;
  kind:
    | "library"
    | "framework"
    | "tool"
    | "standard"
    | "protocol"
    | "service"
    | "platform"
    | "pattern"
    | "language"
    | "method"
    | "other";
  relevance: string;
  officialUrl?: string;
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

## 初期 Domain セット

最上位 Domain は [domains.yaml](../data/knowledge-map/domains.yaml) に保存する。

採用方針:

- Domain 数は 14 にする
- 表示名や説明は日本語にする
- `slug` や YAML key は、seed として安定させるため英語のままにする
- CS の基礎と、プロダクト開発、運用、事業判断、組織設計を同じ学習地図に載せる
- Domain は完全な木ではなく、後で edge を張るための大きな棚として扱う
- `Mathematical and Theoretical Foundations` は、Algorithms / AI / Data / Security の前提になるため `medium` にする
- `Artificial Intelligence and Intelligent Systems` は、未知語発見の重要度を考えて `high` にする
- 広すぎる Domain は、最上位では分割せず、Knowledge Area 以下で分ける

採用 Domain:

| Domain | Priority | 補足 |
| --- | --- | --- |
| 数学的・理論的基礎 | medium | 計算、証明、確率、統計、形式言語の基礎 |
| アルゴリズムとデータ構造 | high | 問題表現、効率、計算量、データ構造 |
| プログラミング言語とソフトウェア構成 | high | 型、言語、抽象化、コンパイラ、コード構成 |
| コンピュータシステム、ネットワーク、分散基盤 | high | OS、ネットワーク、分散システム、実行基盤 |
| データ管理、分析、実験 | high | DB、データ基盤、指標、分析、実験 |
| 人工知能と知的システム | high | ML、生成AI、推薦、探索、評価 |
| ソフトウェア工学と品質 | high | 要求、設計、テスト、保守、品質 |
| プロダクトエンジニアリングとアプリケーションアーキテクチャ | high | Web/SaaS 実装、API、フロントエンド、バックエンド、統合 |
| UX、HCI、サービスデザイン | high | 人間中心設計、調査、情報設計、アクセシビリティ |
| プロダクトマネジメントとプロダクト戦略 | high | 何を、誰に、なぜ、どの順番で作るか |
| セキュリティ、プライバシー、ガバナンス | high | AppSec、IAM、Privacy、GRC |
| 信頼性、運用、プラットフォームエンジニアリング | high | SLO、Observability、Incident、Release、Platform |
| ビジネス、経済性、意思決定 | high | 収益、価格、資源配分、投資判断 |
| エンジニアリング組織とデリバリーシステム | medium | Team topology、Delivery metrics、Developer Experience |

## 保持方法

マスターデータは、最初から DB だけを正にしない。

まずはリポジトリ内の seed file を正として持ち、DB はアプリで閲覧、検索、進捗管理するための投影先にする。

想定ディレクトリ:

```text
data/
  knowledge-map/
    domains.yaml
    domain-details/
      product-engineering-application-architecture.yaml
      software-engineering-quality.yaml
      data-management-analytics-experimentation.yaml
      security-privacy-governance.yaml
      ...
```

作成済みの詳細 seed:

- [mathematical-theoretical-foundations.yaml](../data/knowledge-map/domain-details/mathematical-theoretical-foundations.yaml)
- [algorithms-data-structures-computation.yaml](../data/knowledge-map/domain-details/algorithms-data-structures-computation.yaml)
- [programming-languages-software-construction.yaml](../data/knowledge-map/domain-details/programming-languages-software-construction.yaml)
- [systems-networks-distributed-infrastructure.yaml](../data/knowledge-map/domain-details/systems-networks-distributed-infrastructure.yaml)
- [data-management-analytics-experimentation.yaml](../data/knowledge-map/domain-details/data-management-analytics-experimentation.yaml)
- [artificial-intelligence-intelligent-systems.yaml](../data/knowledge-map/domain-details/artificial-intelligence-intelligent-systems.yaml)
- [software-engineering-quality.yaml](../data/knowledge-map/domain-details/software-engineering-quality.yaml)
- [product-engineering-application-architecture.yaml](../data/knowledge-map/domain-details/product-engineering-application-architecture.yaml)
- [ux-hci-service-design.yaml](../data/knowledge-map/domain-details/ux-hci-service-design.yaml)
- [product-management-product-strategy.yaml](../data/knowledge-map/domain-details/product-management-product-strategy.yaml)
- [security-privacy-governance.yaml](../data/knowledge-map/domain-details/security-privacy-governance.yaml)
- [reliability-operations-platform-engineering.yaml](../data/knowledge-map/domain-details/reliability-operations-platform-engineering.yaml)
- [business-economics-decision-making.yaml](../data/knowledge-map/domain-details/business-economics-decision-making.yaml)
- [engineering-organization-delivery-systems.yaml](../data/knowledge-map/domain-details/engineering-organization-delivery-systems.yaml)

seed file は次のコマンドで検証する。

```bash
pnpm knowledge-map:validate
```

検証では、Domain と詳細 seed の対応、YAML 構文、必須フィールド、domain 内 slug 重複、edge 参照、relationType、文字化けを確認する。domain 横断の同名 slug は、後続の統合作業の候補として warning に出す。

seed 作成時は、Term を中心に `search` ブロックも付けられる。これは表示名ではなく、あとで Resource / Note / Question との候補リンクを作るための検索補助情報として使う。

```yaml
- slug: retrieval-augmented-generation
  name: 検索拡張生成
  summary: 外部検索結果を文脈へ注入して生成する構成。
  whyLearn: 幻覚低減、最新知識反映、出典提示の設計に不可欠。
  promptHint: RAG がモデル内部知識だけに頼る方法とどう違うか説明して。
  aliases:
    - RAG
    - retrieval-augmented generation
  search:
    keywords:
      - retrieval
      - grounding
      - vector search
      - semantic search
      - embedding search
    relatedNames:
      - name: LangChain
        kind: framework
        relevance: RAG pipeline を組むときに頻出する orchestration framework。
      - name: pgvector
        kind: tool
        relevance: PostgreSQL 上で vector search を行う拡張。
    commonSignals:
      - 社内文書を検索して回答する
      - 回答に出典を付ける
    antiSignals:
      - 単に検索フォームがあるだけ
      - 通常の SQL 検索だけ
```

seed 作成を依頼するときは、各 Term について次を明示する。

```text
各 Term に search ブロックを追加してください。
keywords には、候補生成に使える同義語、略称、英語名、日本語名、周辺語を入れてください。
relatedNames には、その Term と実務上よく一緒に出るライブラリ、フレームワーク、ツール、標準、プロトコル、サービス、パターンを入れてください。
commonSignals には、Resource / Note / 会話本文に出たら候補化しやすい語句や状況表現を入れてください。
antiSignals には、出てもその Term とは限らない誤爆しやすい語句や除外条件を入れてください。
search は候補生成用なので、説明文の重複ではなく、検索・照合に効く具体語を優先してください。
```

DB へ反映する場合は、migration 適用後に import を実行する。

```bash
pnpm db:migrate
pnpm knowledge-map:import
```

`knowledge-map:import` は先に seed validation を実行し、通過した場合だけ DB を更新する。

DB 側の実装:

```text
knowledge_nodes
- id
- node_key
- domain_slug
- slug
- name
- level
- parent_id
- summary
- why_learn
- prompt_hint
- boundary_notes
- sort_order
- curation_status
- source_file
- content_hash
- created_at
- updated_at

knowledge_edges
- id
- from_node_id
- to_node_id
- from_ref
- to_ref
- relation_type
- reason
- edge_scope
- source_file
- created_at
- updated_at

knowledge_aliases
- id
- node_id
- alias
- created_at

knowledge_node_search_documents
- id
- node_id
- search_text
- content_hash
- created_at
- updated_at

knowledge_node_search_keywords
- id
- node_id
- keyword
- keyword_type
- source_file
- created_at

knowledge_related_items
- id
- name
- item_type
- official_url
- content_hash
- created_at
- updated_at

knowledge_node_related_items
- id
- node_id
- related_item_id
- relevance
- source_file
- created_at
```

ユーザー個人の学習状態はマスターとは分ける。

```text
knowledge_node_progress
- id
- node_id
- status
- interest_level
- last_reviewed_at
- memo
- created_at
- updated_at

knowledge_entity_links
- id
- node_id
- entity_type
- entity_id
- relation_type
- created_at
```

`status` の候補:

- `unknown`
- `interested`
- `learning`
- `understood`
- `ignored`

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
- seed file を無検証で DB に直接投入する
- ユーザーごとに複雑なカリキュラム最適化を行う
