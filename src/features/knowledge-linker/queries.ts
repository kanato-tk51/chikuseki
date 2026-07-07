import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  entityLinks,
  knowledgeAliases,
  knowledgeEntityLinks,
  knowledgeNodeProgress,
  knowledgeNodeRelatedItems,
  knowledgeNodeSearchDocuments,
  knowledgeNodeSearchKeywords,
  knowledgeNodes,
  knowledgeRelatedItems,
  reviewItems,
  learningNotes,
  questionCards,
  resources,
} from "@/db/schema";
import type {
  KnowledgeNodeLevel,
  KnowledgeProgressStatus,
} from "@/features/knowledge-map/validators";
import type {
  KnowledgeLinkableEntityType,
  KnowledgeQuestionDraftRequest,
  KnowledgeLinkDeleteRequest,
  KnowledgeLinkSaveRequest,
} from "@/features/knowledge-linker/validators";
import type {
  DifficultyLevel,
  QuestionStatus,
} from "@/features/questions/validators";
import type { ReviewResult } from "@/features/reviews/validators";

type SearchKeywordType = "keyword" | "common_signal" | "anti_signal";

export type KnowledgeLinkCandidateReason = {
  source:
    | "name"
    | "slug"
    | "alias"
    | "keyword"
    | "common_signal"
    | "related_item"
    | "search_text"
    | "anti_signal";
  label: string;
  matchedText: string;
  weight: number;
};

export type KnowledgeLinkCandidate = {
  id: string;
  domainSlug: string;
  slug: string;
  name: string;
  level: KnowledgeNodeLevel;
  summary: string;
  status: KnowledgeProgressStatus;
  score: number;
  confidence: "high" | "medium" | "low";
  path: Array<{
    id: string;
    slug: string;
    name: string;
    level: KnowledgeNodeLevel;
  }>;
  reasons: KnowledgeLinkCandidateReason[];
};

type KnowledgeLinkerNode = {
  id: string;
  domainSlug: string;
  slug: string;
  name: string;
  level: KnowledgeNodeLevel;
  parentId: string | null;
  summary: string;
  sortOrder: number;
  status: KnowledgeProgressStatus;
};

type Signal = {
  source: KnowledgeLinkCandidateReason["source"];
  label: string;
  text: string;
  weight: number;
};

type SuggestKnowledgeLinksParams = {
  text: string;
  domainSlug?: string;
  limit?: number;
};

export type KnowledgeLinkedNode = {
  id: string;
  domainSlug: string;
  slug: string;
  name: string;
  level: KnowledgeNodeLevel;
  summary: string;
  status: KnowledgeProgressStatus;
  relationType: string;
  createdAt: Date;
};

export type KnowledgeLinkedEntity = {
  id: string;
  type: KnowledgeLinkableEntityType;
  title: string;
  href: string;
  relationType: string;
  createdAt: Date;
  detail: string | null;
  question?: {
    status: QuestionStatus;
    difficulty: DifficultyLevel;
    review: {
      reviewItemId: string;
      nextReviewAt: Date;
      intervalDays: number;
      ease: number;
      lastResult: ReviewResult | null;
      due: boolean;
    } | null;
  };
};

export type KnowledgeQuestionDraft = {
  id: string;
  title: string;
  nodeName: string;
  href: string;
};

type AttentionQuestionReason = "due" | "weak" | "draft" | "not_queued";

export type KnowledgeNodeLearningStats = {
  linkedQuestionCount: number;
  draftQuestionCount: number;
  activeQuestionCount: number;
  queuedQuestionCount: number;
  dueQuestionCount: number;
  lastAgainOrHardCount: number;
  notQueuedQuestionCount: number;
  attentionQuestions: Array<{
    id: string;
    title: string;
    href: string;
    status: QuestionStatus;
    difficulty: DifficultyLevel;
    nextReviewAt: Date | null;
    lastResult: ReviewResult | null;
    reason: AttentionQuestionReason;
  }>;
};

const levelPriority: Record<KnowledgeNodeLevel, number> = {
  term: 5,
  concept: 4,
  topic_cluster: 3,
  knowledge_area: 2,
  domain: 1,
};

const ambiguousShortAcronyms = new Set([
  "as",
  "do",
  "go",
  "in",
  "map",
  "or",
  "red",
  "set",
  "to",
  "use",
]);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const nodeSelection = {
  id: knowledgeNodes.id,
  domainSlug: knowledgeNodes.domainSlug,
  slug: knowledgeNodes.slug,
  name: knowledgeNodes.name,
  level: knowledgeNodes.level,
  parentId: knowledgeNodes.parentId,
  summary: knowledgeNodes.summary,
  sortOrder: knowledgeNodes.sortOrder,
  status:
    sql<KnowledgeProgressStatus>`coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status)`.as(
      "status",
    ),
};

function normalizeForMatch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[_＿]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isLatinLike(value: string) {
  return /^[a-z0-9][a-z0-9.+#/-]*$/i.test(value);
}

function containsSignal(
  rawText: string,
  normalizedText: string,
  rawSignal: string,
) {
  const signal = normalizeForMatch(rawSignal);

  if (signal.length < 2) {
    return false;
  }

  if (
    /^[A-Z0-9]{2,4}$/.test(rawSignal.trim()) &&
    ambiguousShortAcronyms.has(signal)
  ) {
    const pattern = new RegExp(
      `(?:^|[^A-Za-z0-9])${escapeRegExp(rawSignal.trim())}(?:$|[^A-Za-z0-9])`,
    );

    return pattern.test(rawText);
  }

  if (isLatinLike(signal) && signal.length <= 4) {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9])${escapeRegExp(signal)}(?:$|[^a-z0-9])`,
      "i",
    );

    return pattern.test(normalizedText);
  }

  return normalizedText.includes(signal);
}

function extractTextTokens(normalizedText: string) {
  const tokens = new Set<string>();
  const latinTokens = normalizedText.match(/[a-z0-9][a-z0-9.+#/-]{2,}/g) ?? [];
  const japaneseTokens =
    normalizedText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{3,}/gu) ??
    [];

  for (const token of [...latinTokens, ...japaneseTokens]) {
    if (token.length >= 3 && token.length <= 40) {
      tokens.add(token);
    }
  }

  return tokens;
}

function confidenceForScore(score: number): KnowledgeLinkCandidate["confidence"] {
  if (score >= 30) {
    return "high";
  }

  if (score >= 16) {
    return "medium";
  }

  return "low";
}

function buildPath(
  node: KnowledgeLinkerNode,
  nodesById: Map<string, KnowledgeLinkerNode>,
) {
  const path: KnowledgeLinkCandidate["path"] = [];
  let current: KnowledgeLinkerNode | undefined = node;
  const seen = new Set<string>();

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.push({
      id: current.id,
      slug: current.slug,
      name: current.name,
      level: current.level,
    });

    current = current.parentId ? nodesById.get(current.parentId) : undefined;
  }

  return path.reverse();
}

function addSignal(
  signalsByNode: Map<string, Signal[]>,
  nodeId: string,
  signal: Signal,
) {
  const text = signal.text.trim();

  if (!text) {
    return;
  }

  const signals = signalsByNode.get(nodeId) ?? [];

  if (
    !signals.some(
      (existing) =>
        existing.source === signal.source &&
        normalizeForMatch(existing.text) === normalizeForMatch(text),
    )
  ) {
    signals.push({ ...signal, text });
    signalsByNode.set(nodeId, signals);
  }
}

export async function suggestKnowledgeLinks({
  text,
  domainSlug,
  limit = 30,
}: SuggestKnowledgeLinksParams): Promise<KnowledgeLinkCandidate[]> {
  const conditions = [ne(knowledgeNodes.curationStatus, "deprecated")];

  if (domainSlug) {
    conditions.push(eq(knowledgeNodes.domainSlug, domainSlug));
  }

  const nodes = (
    await getDb()
      .select(nodeSelection)
      .from(knowledgeNodes)
      .leftJoin(
        knowledgeNodeProgress,
        eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
      )
      .where(and(...conditions))
      .orderBy(
        asc(knowledgeNodes.domainSlug),
        asc(knowledgeNodes.level),
        asc(knowledgeNodes.sortOrder),
        asc(knowledgeNodes.name),
      )
  ).map((node) => ({
    ...node,
    level: node.level as KnowledgeNodeLevel,
    status: node.status as KnowledgeProgressStatus,
  }));

  const nodeIds = nodes.map((node) => node.id);

  if (nodeIds.length === 0) {
    return [];
  }

  const [aliases, keywords, relatedItems, searchDocuments] = await Promise.all([
    getDb()
      .select({
        nodeId: knowledgeAliases.nodeId,
        alias: knowledgeAliases.alias,
      })
      .from(knowledgeAliases)
      .where(inArray(knowledgeAliases.nodeId, nodeIds)),
    getDb()
      .select({
        nodeId: knowledgeNodeSearchKeywords.nodeId,
        keyword: knowledgeNodeSearchKeywords.keyword,
        keywordType: knowledgeNodeSearchKeywords.keywordType,
      })
      .from(knowledgeNodeSearchKeywords)
      .where(inArray(knowledgeNodeSearchKeywords.nodeId, nodeIds)),
    getDb()
      .select({
        nodeId: knowledgeNodeRelatedItems.nodeId,
        name: knowledgeRelatedItems.name,
        itemType: knowledgeRelatedItems.itemType,
      })
      .from(knowledgeNodeRelatedItems)
      .innerJoin(
        knowledgeRelatedItems,
        eq(knowledgeNodeRelatedItems.relatedItemId, knowledgeRelatedItems.id),
      )
      .where(inArray(knowledgeNodeRelatedItems.nodeId, nodeIds)),
    getDb()
      .select({
        nodeId: knowledgeNodeSearchDocuments.nodeId,
        searchText: knowledgeNodeSearchDocuments.searchText,
      })
      .from(knowledgeNodeSearchDocuments)
      .where(inArray(knowledgeNodeSearchDocuments.nodeId, nodeIds)),
  ]);

  const signalsByNode = new Map<string, Signal[]>();
  const antiSignalsByNode = new Map<string, Signal[]>();
  const searchTextByNode = new Map<string, string>();

  for (const node of nodes) {
    addSignal(signalsByNode, node.id, {
      source: "name",
      label: "Node name",
      text: node.name,
      weight: 18,
    });
    addSignal(signalsByNode, node.id, {
      source: "slug",
      label: "Slug phrase",
      text: node.slug.replace(/-/g, " "),
      weight: 8,
    });
  }

  for (const alias of aliases) {
    addSignal(signalsByNode, alias.nodeId, {
      source: "alias",
      label: "Alias",
      text: alias.alias,
      weight: 18,
    });
  }

  for (const keyword of keywords) {
    const keywordType = keyword.keywordType as SearchKeywordType;
    const signal: Signal = {
      source: keywordType,
      label:
        keywordType === "common_signal"
          ? "Common signal"
          : keywordType === "anti_signal"
            ? "Anti signal"
            : "Search keyword",
      text: keyword.keyword,
      weight:
        keywordType === "common_signal"
          ? 10
          : keywordType === "anti_signal"
            ? -14
            : 12,
    };

    if (keywordType === "anti_signal") {
      addSignal(antiSignalsByNode, keyword.nodeId, signal);
    } else {
      addSignal(signalsByNode, keyword.nodeId, signal);
    }
  }

  for (const relatedItem of relatedItems) {
    addSignal(signalsByNode, relatedItem.nodeId, {
      source: "related_item",
      label: `Related ${relatedItem.itemType}`,
      text: relatedItem.name,
      weight: 14,
    });
  }

  for (const document of searchDocuments) {
    searchTextByNode.set(document.nodeId, normalizeForMatch(document.searchText));
  }

  const normalizedText = normalizeForMatch(text);
  const textTokens = extractTextTokens(normalizedText);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const candidates: KnowledgeLinkCandidate[] = [];

  for (const node of nodes) {
    const reasons: KnowledgeLinkCandidateReason[] = [];
    let score = 0;
    const seenReasonKeys = new Set<string>();

    for (const signal of signalsByNode.get(node.id) ?? []) {
      if (!containsSignal(text, normalizedText, signal.text)) {
        continue;
      }

      const reasonKey = `${signal.source}:${normalizeForMatch(signal.text)}`;

      if (seenReasonKeys.has(reasonKey)) {
        continue;
      }

      seenReasonKeys.add(reasonKey);
      score += signal.weight;
      reasons.push({
        source: signal.source,
        label: signal.label,
        matchedText: signal.text,
        weight: signal.weight,
      });
    }

    for (const antiSignal of antiSignalsByNode.get(node.id) ?? []) {
      if (!containsSignal(text, normalizedText, antiSignal.text)) {
        continue;
      }

      score += antiSignal.weight;
      reasons.push({
        source: "anti_signal",
        label: antiSignal.label,
        matchedText: antiSignal.text,
        weight: antiSignal.weight,
      });
    }

    const searchText = searchTextByNode.get(node.id);

    if (score > 0 && searchText) {
      const supportingTokens = [...textTokens]
        .filter((token) => token.length >= 5 && searchText.includes(token))
        .slice(0, 4);

      for (const token of supportingTokens) {
        score += 1;
        reasons.push({
          source: "search_text",
          label: "Search document context",
          matchedText: token,
          weight: 1,
        });
      }
    }

    if (score < 8 || reasons.every((reason) => reason.weight <= 0)) {
      continue;
    }

    candidates.push({
      id: node.id,
      domainSlug: node.domainSlug,
      slug: node.slug,
      name: node.name,
      level: node.level,
      summary: node.summary,
      status: node.status,
      score,
      confidence: confidenceForScore(score),
      path: buildPath(node, nodesById),
      reasons: reasons
        .sort((a, b) => b.weight - a.weight || a.matchedText.localeCompare(b.matchedText))
        .slice(0, 8),
    });
  }

  return candidates
    .sort(
      (a, b) =>
        b.score - a.score ||
        levelPriority[b.level] - levelPriority[a.level] ||
        a.domainSlug.localeCompare(b.domainSlug) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

async function entityExists(
  entityType: KnowledgeLinkableEntityType,
  entityId: string,
) {
  if (entityType === "resource") {
    const [entity] = await getDb()
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.id, entityId))
      .limit(1);

    return Boolean(entity);
  }

  if (entityType === "learning_note") {
    const [entity] = await getDb()
      .select({ id: learningNotes.id })
      .from(learningNotes)
      .where(eq(learningNotes.id, entityId))
      .limit(1);

    return Boolean(entity);
  }

  const [entity] = await getDb()
    .select({ id: questionCards.id })
    .from(questionCards)
    .where(eq(questionCards.id, entityId))
    .limit(1);

  return Boolean(entity);
}

async function getLinkSourceEntity(
  entityType: "resource" | "learning_note",
  entityId: string,
) {
  if (entityType === "resource") {
    const [entity] = await getDb()
      .select({
        id: resources.id,
        title: resources.title,
        summary: resources.summary,
        memo: resources.memo,
        url: resources.url,
      })
      .from(resources)
      .where(eq(resources.id, entityId))
      .limit(1);

    return entity
      ? {
          ...entity,
          entityType,
          contextText: [entity.summary, entity.memo, entity.url]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join("\n\n"),
        }
      : null;
  }

  const [entity] = await getDb()
    .select({
      id: learningNotes.id,
      title: learningNotes.title,
      bodyMd: learningNotes.bodyMd,
      resourceTitle: resources.title,
      resourceUrl: resources.url,
    })
    .from(learningNotes)
    .leftJoin(resources, eq(learningNotes.resourceId, resources.id))
    .where(eq(learningNotes.id, entityId))
    .limit(1);

  return entity
    ? {
        ...entity,
        entityType,
        contextText: [entity.resourceTitle, entity.resourceUrl, entity.bodyMd]
          .filter((value): value is string => Boolean(value && value.trim()))
          .join("\n\n"),
      }
    : null;
}

export async function listKnowledgeLinksForEntity({
  entityType,
  entityId,
}: {
  entityType: KnowledgeLinkableEntityType;
  entityId: string;
}): Promise<KnowledgeLinkedNode[]> {
  if (!uuidPattern.test(entityId)) {
    return [];
  }

  const rows = await getDb()
    .select({
      id: knowledgeNodes.id,
      domainSlug: knowledgeNodes.domainSlug,
      slug: knowledgeNodes.slug,
      name: knowledgeNodes.name,
      level: knowledgeNodes.level,
      summary: knowledgeNodes.summary,
      status:
        sql<KnowledgeProgressStatus>`coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status)`.as(
          "status",
        ),
      relationType: knowledgeEntityLinks.relationType,
      createdAt: knowledgeEntityLinks.createdAt,
    })
    .from(knowledgeEntityLinks)
    .innerJoin(knowledgeNodes, eq(knowledgeEntityLinks.nodeId, knowledgeNodes.id))
    .leftJoin(
      knowledgeNodeProgress,
      eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
    )
    .where(
      and(
        eq(knowledgeEntityLinks.entityType, entityType),
        eq(knowledgeEntityLinks.entityId, entityId),
        ne(knowledgeNodes.curationStatus, "deprecated"),
      ),
    )
    .orderBy(
      asc(knowledgeNodes.domainSlug),
      asc(knowledgeNodes.level),
      asc(knowledgeNodes.sortOrder),
      asc(knowledgeNodes.name),
    );

  return rows.map((row) => ({
    ...row,
    level: row.level as KnowledgeNodeLevel,
    status: row.status as KnowledgeProgressStatus,
  }));
}

export async function saveKnowledgeEntityLinks({
  entityType,
  entityId,
  nodeIds,
  relationType,
}: KnowledgeLinkSaveRequest) {
  const uniqueNodeIds = [...new Set(nodeIds)];

  if (!(await entityExists(entityType, entityId))) {
    throw new Error("リンク対象が見つかりません");
  }

  const nodes = await getDb()
    .select({ id: knowledgeNodes.id })
    .from(knowledgeNodes)
    .where(
      and(
        inArray(knowledgeNodes.id, uniqueNodeIds),
        ne(knowledgeNodes.curationStatus, "deprecated"),
      ),
    );
  const validNodeIds = nodes.map((node) => node.id);

  if (validNodeIds.length === 0) {
    throw new Error("保存できる Knowledge Node がありません");
  }

  const inserted = await getDb()
    .insert(knowledgeEntityLinks)
    .values(
      validNodeIds.map((nodeId) => ({
        nodeId,
        entityType,
        entityId,
        relationType,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: knowledgeEntityLinks.id });

  return {
    savedCount: inserted.length,
    links: await listKnowledgeLinksForEntity({ entityType, entityId }),
  };
}

export async function deleteKnowledgeEntityLink({
  entityType,
  entityId,
  nodeId,
  relationType,
}: KnowledgeLinkDeleteRequest) {
  await getDb()
    .delete(knowledgeEntityLinks)
    .where(
      and(
        eq(knowledgeEntityLinks.entityType, entityType),
        eq(knowledgeEntityLinks.entityId, entityId),
        eq(knowledgeEntityLinks.nodeId, nodeId),
        eq(knowledgeEntityLinks.relationType, relationType),
      ),
    );

  return {
    links: await listKnowledgeLinksForEntity({ entityType, entityId }),
  };
}

function questionDraftTitle(sourceTitle: string, nodeName: string) {
  const title = `${nodeName}: ${sourceTitle}`;

  return title.length > 300 ? `${title.slice(0, 297)}...` : title;
}

function questionDraftQuestion(sourceTitle: string, nodeName: string) {
  return [
    `「${sourceTitle}」の文脈で、${nodeName} とは何かを説明してください。`,
    "",
    "- 何を解決する概念・技術か",
    "- 実務でどこに出てくるか",
    "- 似た概念と混同しやすい点は何か",
  ].join("\n");
}

function questionDraftAnswer(node: {
  name: string;
  summary: string;
  whyLearn: string | null;
  promptHint: string | null;
}) {
  return [
    `${node.name}: ${node.summary}`,
    node.whyLearn ? `\n覚える理由: ${node.whyLearn}` : null,
    node.promptHint ? `\n確認観点: ${node.promptHint}` : null,
    "\nこの回答は Knowledge Map から作った draft です。元の Resource / Note を見直して、具体例や補足を追加してください。",
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

export async function createQuestionDraftsForKnowledgeLinks({
  entityType,
  entityId,
  nodeIds,
}: KnowledgeQuestionDraftRequest) {
  const source = await getLinkSourceEntity(entityType, entityId);

  if (!source) {
    throw new Error("Question draft の元になる対象が見つかりません");
  }

  const uniqueNodeIds = [...new Set(nodeIds)];
  const nodes = await getDb()
    .select({
      id: knowledgeNodes.id,
      domainSlug: knowledgeNodes.domainSlug,
      slug: knowledgeNodes.slug,
      name: knowledgeNodes.name,
      summary: knowledgeNodes.summary,
      whyLearn: knowledgeNodes.whyLearn,
      promptHint: knowledgeNodes.promptHint,
    })
    .from(knowledgeNodes)
    .where(
      and(
        inArray(knowledgeNodes.id, uniqueNodeIds),
        ne(knowledgeNodes.curationStatus, "deprecated"),
      ),
    )
    .limit(20);

  if (nodes.length === 0) {
    throw new Error("Question draft に使える Knowledge Node がありません");
  }

  const created = await getDb().transaction(async (tx) => {
    const drafts: KnowledgeQuestionDraft[] = [];

    for (const node of nodes) {
      const [question] = await tx
        .insert(questionCards)
        .values({
          title: questionDraftTitle(source.title, node.name),
          difficulty: "medium",
          status: "draft",
          questionMd: questionDraftQuestion(source.title, node.name),
          answerMd: questionDraftAnswer(node),
          explanationMd: [
            `Source: ${source.title}`,
            source.contextText ? `\nContext:\n${source.contextText.slice(0, 2000)}` : null,
          ]
            .filter((value): value is string => Boolean(value))
            .join("\n"),
        })
        .returning({ id: questionCards.id, title: questionCards.title });

      await tx
        .insert(knowledgeEntityLinks)
        .values({
          nodeId: node.id,
          entityType: "question_card",
          entityId: question.id,
          relationType: "tests",
        })
        .onConflictDoNothing();

      await tx
        .insert(entityLinks)
        .values({
          fromType: entityType,
          fromId: source.id,
          toType: "question_card",
          toId: question.id,
          relationType: "derived_question",
        })
        .onConflictDoNothing();

      drafts.push({
        id: question.id,
        title: question.title,
        nodeName: node.name,
        href: `/questions/${question.id}`,
      });
    }

    return drafts;
  });

  return { created };
}

export async function listKnowledgeLinkedEntitiesForNode(
  nodeId: string,
): Promise<KnowledgeLinkedEntity[]> {
  const now = new Date();
  const [resourceRows, noteRows, questionRows] = await Promise.all([
    getDb()
      .select({
        id: resources.id,
        title: resources.title,
        relationType: knowledgeEntityLinks.relationType,
        createdAt: knowledgeEntityLinks.createdAt,
        detail: resources.url,
      })
      .from(knowledgeEntityLinks)
      .innerJoin(resources, eq(knowledgeEntityLinks.entityId, resources.id))
      .where(
        and(
          eq(knowledgeEntityLinks.nodeId, nodeId),
          eq(knowledgeEntityLinks.entityType, "resource"),
        ),
      )
      .orderBy(desc(knowledgeEntityLinks.createdAt))
      .limit(20),
    getDb()
      .select({
        id: learningNotes.id,
        title: learningNotes.title,
        relationType: knowledgeEntityLinks.relationType,
        createdAt: knowledgeEntityLinks.createdAt,
        detail: learningNotes.noteType,
      })
      .from(knowledgeEntityLinks)
      .innerJoin(
        learningNotes,
        eq(knowledgeEntityLinks.entityId, learningNotes.id),
      )
      .where(
        and(
          eq(knowledgeEntityLinks.nodeId, nodeId),
          eq(knowledgeEntityLinks.entityType, "learning_note"),
        ),
      )
      .orderBy(desc(knowledgeEntityLinks.createdAt))
      .limit(20),
    getDb()
      .select({
        id: questionCards.id,
        title: questionCards.title,
        relationType: knowledgeEntityLinks.relationType,
        createdAt: knowledgeEntityLinks.createdAt,
        detail: questionCards.difficulty,
        status: questionCards.status,
        difficulty: questionCards.difficulty,
        reviewItemId: reviewItems.id,
        nextReviewAt: reviewItems.nextReviewAt,
        intervalDays: reviewItems.intervalDays,
        ease: reviewItems.ease,
        lastResult: reviewItems.lastResult,
      })
      .from(knowledgeEntityLinks)
      .innerJoin(
        questionCards,
        eq(knowledgeEntityLinks.entityId, questionCards.id),
      )
      .leftJoin(
        reviewItems,
        and(
          eq(reviewItems.targetType, "question_card"),
          eq(reviewItems.targetId, questionCards.id),
        ),
      )
      .where(
        and(
          eq(knowledgeEntityLinks.nodeId, nodeId),
          eq(knowledgeEntityLinks.entityType, "question_card"),
        ),
      )
      .orderBy(desc(knowledgeEntityLinks.createdAt))
      .limit(20),
  ]);

  return [
    ...resourceRows.map((row) => ({
      ...row,
      type: "resource" as const,
      href: `/resources/${row.id}`,
    })),
    ...noteRows.map((row) => ({
      ...row,
      type: "learning_note" as const,
      href: `/notes/${row.id}`,
    })),
    ...questionRows.map((row) => ({
      ...row,
      type: "question_card" as const,
      href: `/questions/${row.id}`,
      question: {
        status: row.status as QuestionStatus,
        difficulty: row.difficulty as DifficultyLevel,
        review:
          row.reviewItemId && row.nextReviewAt
            ? {
                reviewItemId: row.reviewItemId,
                nextReviewAt: row.nextReviewAt,
                intervalDays: row.intervalDays ?? 0,
                ease: row.ease ?? 2.5,
                lastResult: row.lastResult as ReviewResult | null,
                due: row.nextReviewAt <= now,
              }
            : null,
      },
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getKnowledgeNodeLearningStats(
  nodeId: string,
): Promise<KnowledgeNodeLearningStats> {
  const now = new Date();
  const rows = await getDb()
    .select({
      id: questionCards.id,
      title: questionCards.title,
      status: questionCards.status,
      difficulty: questionCards.difficulty,
      reviewItemId: reviewItems.id,
      nextReviewAt: reviewItems.nextReviewAt,
      lastResult: reviewItems.lastResult,
      createdAt: questionCards.createdAt,
    })
    .from(knowledgeEntityLinks)
    .innerJoin(questionCards, eq(knowledgeEntityLinks.entityId, questionCards.id))
    .leftJoin(
      reviewItems,
      and(
        eq(reviewItems.targetType, "question_card"),
        eq(reviewItems.targetId, questionCards.id),
      ),
    )
    .where(
      and(
        eq(knowledgeEntityLinks.nodeId, nodeId),
        eq(knowledgeEntityLinks.entityType, "question_card"),
      ),
    )
    .orderBy(desc(questionCards.createdAt))
    .limit(500);

  const attentionQuestions = rows
    .map((row) => {
      const due = Boolean(row.nextReviewAt && row.nextReviewAt <= now);
      const weak = row.lastResult === "again" || row.lastResult === "hard";
      const draft = row.status === "draft";
      const notQueued = !row.reviewItemId && row.status !== "archived";
      let reason: AttentionQuestionReason | null = null;

      if (due) {
        reason = "due";
      } else if (weak) {
        reason = "weak";
      } else if (draft) {
        reason = "draft";
      } else if (notQueued) {
        reason = "not_queued";
      }

      return reason
        ? {
            id: row.id,
            title: row.title,
            href: `/questions/${row.id}`,
            status: row.status as QuestionStatus,
            difficulty: row.difficulty as DifficultyLevel,
            nextReviewAt: row.nextReviewAt,
            lastResult: row.lastResult as ReviewResult | null,
            reason,
          }
        : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => {
      const priority: Record<AttentionQuestionReason, number> = {
        due: 0,
        weak: 1,
        draft: 2,
        not_queued: 3,
      };

      return (
        priority[a.reason] - priority[b.reason] ||
        (a.nextReviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.nextReviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
        a.title.localeCompare(b.title)
      );
    })
    .slice(0, 8);

  return {
    linkedQuestionCount: rows.length,
    draftQuestionCount: rows.filter((row) => row.status === "draft").length,
    activeQuestionCount: rows.filter((row) => row.status === "active").length,
    queuedQuestionCount: rows.filter((row) => Boolean(row.reviewItemId)).length,
    dueQuestionCount: rows.filter(
      (row) => row.nextReviewAt && row.nextReviewAt <= now,
    ).length,
    lastAgainOrHardCount: rows.filter(
      (row) => row.lastResult === "again" || row.lastResult === "hard",
    ).length,
    notQueuedQuestionCount: rows.filter(
      (row) => !row.reviewItemId && row.status !== "archived",
    ).length,
    attentionQuestions,
  };
}

export async function listKnowledgeLinksForQuestionIds(questionIds: string[]) {
  const uniqueQuestionIds = [...new Set(questionIds)].filter((id) =>
    uuidPattern.test(id),
  );

  if (uniqueQuestionIds.length === 0) {
    return new Map<string, KnowledgeLinkedNode[]>();
  }

  const rows = await getDb()
    .select({
      questionId: knowledgeEntityLinks.entityId,
      id: knowledgeNodes.id,
      domainSlug: knowledgeNodes.domainSlug,
      slug: knowledgeNodes.slug,
      name: knowledgeNodes.name,
      level: knowledgeNodes.level,
      summary: knowledgeNodes.summary,
      status:
        sql<KnowledgeProgressStatus>`coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status)`.as(
          "status",
        ),
      relationType: knowledgeEntityLinks.relationType,
      createdAt: knowledgeEntityLinks.createdAt,
    })
    .from(knowledgeEntityLinks)
    .innerJoin(knowledgeNodes, eq(knowledgeEntityLinks.nodeId, knowledgeNodes.id))
    .leftJoin(
      knowledgeNodeProgress,
      eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
    )
    .where(
      and(
        eq(knowledgeEntityLinks.entityType, "question_card"),
        inArray(knowledgeEntityLinks.entityId, uniqueQuestionIds),
        ne(knowledgeNodes.curationStatus, "deprecated"),
      ),
    )
    .orderBy(
      asc(knowledgeNodes.domainSlug),
      asc(knowledgeNodes.level),
      asc(knowledgeNodes.sortOrder),
      asc(knowledgeNodes.name),
    );

  const byQuestionId = new Map<string, KnowledgeLinkedNode[]>();

  for (const row of rows) {
    const nodes = byQuestionId.get(row.questionId) ?? [];
    nodes.push({
      id: row.id,
      domainSlug: row.domainSlug,
      slug: row.slug,
      name: row.name,
      level: row.level as KnowledgeNodeLevel,
      summary: row.summary,
      status: row.status as KnowledgeProgressStatus,
      relationType: row.relationType,
      createdAt: row.createdAt,
    });
    byQuestionId.set(row.questionId, nodes);
  }

  return byQuestionId;
}
