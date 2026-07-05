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

## 初期 Domain セット

ChatGPT Pro の Deep Research で、ACM CCS、ACM/IEEE/AAAI CS2023、SWEBOK、NIST、SRE、DORA、ISPMA、DAMA-DMBOK などを参照し、最上位 Domain の初期案を作成した。

初期 seed は [domains.yaml](../data/knowledge-map/domains.yaml) に保存する。

採用方針:

- Domain 数は 14 にする
- 表示名や説明は日本語にする
- `slug` や YAML key は、seed として安定させるため英語のままにする
- CS の基礎と、プロダクト開発、運用、事業判断、組織設計を同じ学習地図に載せる
- Domain は完全な木ではなく、後で edge を張るための大きな棚として扱う
- `Mathematical and Theoretical Foundations` は、Deep Research 結果では `low` だったが、Algorithms / AI / Data / Security の前提になるため `medium` に補正する
- `Artificial Intelligence and Intelligent Systems` は、chikuseki の今後の AI 連携と未知語発見の重要度を考え、`medium` から `high` に補正する
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

今後、Domain ごとの Deep Research で `Knowledge Area -> Topic Cluster -> Concept / Technique -> Term` を作る。

## Domain 深掘り用プロンプトテンプレート

各 Domain を深掘りするときは、基本的に同じプロンプトを使い、`{DOMAIN_NAME}` と `{DOMAIN_SLUG}` だけを置き換える。

```text
あなたは、コンピュータサイエンス、ソフトウェア工学、プロダクト開発、UX、データ分析、事業・運用・組織設計を横断して整理できるリサーチャー兼情報設計者です。

私は、個人用の技術学習アプリ「chikuseki」に、コンピュータサイエンス全般からプロダクト開発・運用・事業判断までを横断的に学ぶための Knowledge Map マスターデータを作ろうとしています。

今回は、以下の Domain だけを Deep Research で深掘りしてください。

Domain:
- name: {DOMAIN_NAME}
- slug: {DOMAIN_SLUG}

前提:
- Knowledge Map 全体は次の5階層です。

Domain
  Knowledge Area
    Topic Cluster
      Concept / Technique
        Term

- 最下層の Term には、具体的な技術用語、概念名、手法名、規格名、パターン名、ライブラリ名などを置きます。
- 完全な木構造ではなく、後で related / prerequisite / compare_with / used_in の edge を追加する前提です。
- 表示名、説明、解説は日本語にしてください。
- slug は英語の kebab-case にしてください。

目的:
- この Domain の重要な Knowledge Area、Topic Cluster、Concept / Technique、Term を洗い出す
- 初学者向けに薄くしすぎず、研究者向けに細かくしすぎず、実務学習に使いやすい粒度にする
- CS基礎として重要な用語と、現代のプロダクト開発・運用で重要な用語の両方を拾う
- 後で YAML seed としてアプリに投入できる構造にする
- この Domain を学ぶと、どのような技術判断・設計判断・レビュー観点が得られるか分かるようにする

やってほしいこと:
1. この Domain の定義と境界をレビューする
2. 主要な Knowledge Area を作る
3. 各 Knowledge Area 配下に Topic Cluster を作る
4. 各 Topic Cluster 配下に Concept / Technique を作る
5. 各 Concept / Technique 配下に重要 Term を置く
6. 各 Term に summary / whyLearn / promptHint / aliases を付ける
7. prerequisite / compare_with / used_in / related の候補 edge を出す
8. 粒度が混ざっていないか自己レビューする
9. 参考にした標準・体系・情報源を明記する

出力形式:
1. まず Markdown で設計判断を説明する
2. 次に Knowledge Area 一覧を表で出す
3. 最後に machine-readable な YAML を出す

YAML schema:

domain:
  slug: string
  name: string
  summary: string
  boundaryNotes: string
  knowledgeAreas:
    - slug: string
      name: string
      summary: string
      whyLearn: string
      topicClusters:
        - slug: string
          name: string
          summary: string
          concepts:
            - slug: string
              name: string
              summary: string
              whyLearn: string
              terms:
                - slug: string
                  name: string
                  summary: string
                  whyLearn: string
                  promptHint: string
                  aliases:
                    - string
edges:
  - from: string
    to: string
    relationType: prerequisite | compare_with | used_in | related
    reason: string

注意:
- Domain 外の内容を広げすぎない
- ただし、重要な関連領域は edges で表現する
- 単なる用語集ではなく、学習・質問・復習に使える構造にする
- Term は具体的にする
- Concept / Technique と Term を混同しない
- Knowledge Area と Topic Cluster の粒度を混ぜない
- 特定企業や特定フレームワークだけに偏らない
- 最新トレンドは、信頼できる情報源に基づき、確度も含めて説明する
- 不明な点や意見が分かれる分類は boundaryNotes や reason に明記する
```

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

- ソフトウェア工学と品質
- プロダクトエンジニアリングとアプリケーションアーキテクチャ
- データ管理、分析、実験
- セキュリティ、プライバシー、ガバナンス
- コンピュータシステム、ネットワーク、分散基盤

この範囲から作り、実際に ChatGPT import、Note、Question、Review と接続できるかを確認する。
