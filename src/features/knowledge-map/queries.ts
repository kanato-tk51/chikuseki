import type { SQL } from "drizzle-orm";
import { and, asc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/db/client";
import {
  knowledgeAliases,
  knowledgeEdges,
  knowledgeNodeProgress,
  knowledgeNodes,
} from "@/db/schema";
import type {
  KnowledgeNodeLevel,
  KnowledgeProgressStatus,
} from "@/features/knowledge-map/validators";

export type KnowledgeProgressCounts = Record<KnowledgeProgressStatus, number>;

export type KnowledgeNodeSummary = {
  id: string;
  nodeKey: string;
  domainSlug: string;
  slug: string;
  name: string;
  level: KnowledgeNodeLevel;
  parentId: string | null;
  summary: string;
  whyLearn: string | null;
  promptHint: string | null;
  boundaryNotes: string | null;
  sortOrder: number;
  status: KnowledgeProgressStatus;
  interestLevel: number;
  progressMemo: string | null;
};

export type KnowledgeTreeNode = KnowledgeNodeSummary & {
  children: KnowledgeTreeNode[];
};

export type KnowledgeDomainCard = {
  id: string;
  domainSlug: string;
  slug: string;
  name: string;
  summary: string;
  boundaryNotes: string | null;
  sortOrder: number;
  counts: KnowledgeProgressCounts & { total: number };
};

export type KnowledgeSearchResult = KnowledgeNodeSummary & {
  matchedAliases: string[];
};

export type KnowledgeEdgeView = {
  id: string;
  direction: "outgoing" | "incoming";
  relationType: string;
  reason: string;
  edgeScope: string;
  otherNode: {
    id: string;
    domainSlug: string;
    slug: string;
    name: string;
    level: KnowledgeNodeLevel;
  };
};

export type KnowledgeDomainOverview = {
  domain: KnowledgeTreeNode;
  nodes: KnowledgeNodeSummary[];
  selectedNode: KnowledgeNodeSummary;
  tree: KnowledgeTreeNode[];
  aliases: string[];
  edges: KnowledgeEdgeView[];
  counts: KnowledgeProgressCounts & { total: number };
  knowledgeAreaCounts: Array<{
    id: string;
    slug: string;
    name: string;
    counts: KnowledgeProgressCounts & { total: number };
  }>;
};

const emptyCounts: KnowledgeProgressCounts & { total: number } = {
  total: 0,
  unknown: 0,
  interested: 0,
  learning: 0,
  understood: 0,
  ignored: 0,
};

function normalizeCounts(
  counts?: Partial<KnowledgeProgressCounts & { total: number }>,
): KnowledgeProgressCounts & { total: number } {
  return {
    total: counts?.total ?? 0,
    unknown: counts?.unknown ?? 0,
    interested: counts?.interested ?? 0,
    learning: counts?.learning ?? 0,
    understood: counts?.understood ?? 0,
    ignored: counts?.ignored ?? 0,
  };
}

function incrementCount(
  counts: KnowledgeProgressCounts & { total: number },
  status: KnowledgeProgressStatus,
) {
  counts.total += 1;
  counts[status] += 1;
}

function progressStatusSql(status: KnowledgeProgressStatus) {
  return sql`coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = ${status}::knowledge_progress_status`;
}

const nodeSelection = {
  id: knowledgeNodes.id,
  nodeKey: knowledgeNodes.nodeKey,
  domainSlug: knowledgeNodes.domainSlug,
  slug: knowledgeNodes.slug,
  name: knowledgeNodes.name,
  level: knowledgeNodes.level,
  parentId: knowledgeNodes.parentId,
  summary: knowledgeNodes.summary,
  whyLearn: knowledgeNodes.whyLearn,
  promptHint: knowledgeNodes.promptHint,
  boundaryNotes: knowledgeNodes.boundaryNotes,
  sortOrder: knowledgeNodes.sortOrder,
  status:
    sql<KnowledgeProgressStatus>`coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status)`.as(
      "status",
    ),
  interestLevel: sql<number>`coalesce(${knowledgeNodeProgress.interestLevel}, 0)`.as(
    "interest_level",
  ),
  progressMemo: knowledgeNodeProgress.memo,
};

export async function listKnowledgeDomains(): Promise<KnowledgeDomainCard[]> {
  const [domains, countRows] = await Promise.all([
    getDb()
      .select({
        id: knowledgeNodes.id,
        domainSlug: knowledgeNodes.domainSlug,
        slug: knowledgeNodes.slug,
        name: knowledgeNodes.name,
        summary: knowledgeNodes.summary,
        boundaryNotes: knowledgeNodes.boundaryNotes,
        sortOrder: knowledgeNodes.sortOrder,
      })
      .from(knowledgeNodes)
      .where(
        and(
          eq(knowledgeNodes.level, "domain"),
          ne(knowledgeNodes.curationStatus, "deprecated"),
        ),
      )
      .orderBy(asc(knowledgeNodes.sortOrder), asc(knowledgeNodes.name)),
    getDb()
      .select({
        domainSlug: knowledgeNodes.domainSlug,
        total: sql<number>`cast(count(*) as int)`,
        unknown: sql<number>`cast(count(*) filter (where coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = 'unknown') as int)`,
        interested: sql<number>`cast(count(*) filter (where coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = 'interested') as int)`,
        learning: sql<number>`cast(count(*) filter (where coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = 'learning') as int)`,
        understood: sql<number>`cast(count(*) filter (where coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = 'understood') as int)`,
        ignored: sql<number>`cast(count(*) filter (where coalesce(${knowledgeNodeProgress.status}, 'unknown'::knowledge_progress_status) = 'ignored') as int)`,
      })
      .from(knowledgeNodes)
      .leftJoin(
        knowledgeNodeProgress,
        eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
      )
      .where(ne(knowledgeNodes.curationStatus, "deprecated"))
      .groupBy(knowledgeNodes.domainSlug),
  ]);

  const countsByDomain = new Map(
    countRows.map((row) => [row.domainSlug, normalizeCounts(row)]),
  );

  return domains.map((domain) => ({
    ...domain,
    counts: countsByDomain.get(domain.domainSlug) ?? { ...emptyCounts },
  }));
}

export async function searchKnowledgeNodes({
  q,
  status,
  level,
  domainSlug,
}: {
  q?: string;
  status?: KnowledgeProgressStatus;
  level?: KnowledgeNodeLevel;
  domainSlug?: string;
} = {}): Promise<KnowledgeSearchResult[]> {
  const query = q?.trim();
  const conditions: SQL[] = [ne(knowledgeNodes.curationStatus, "deprecated")];

  if (query) {
    const pattern = `%${query}%`;
    const searchCondition = or(
      ilike(knowledgeNodes.name, pattern),
      ilike(knowledgeNodes.slug, pattern),
      ilike(knowledgeNodes.summary, pattern),
      ilike(knowledgeAliases.alias, pattern),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (status) {
    conditions.push(progressStatusSql(status));
  }

  if (level) {
    conditions.push(eq(knowledgeNodes.level, level));
  }

  if (domainSlug) {
    conditions.push(eq(knowledgeNodes.domainSlug, domainSlug));
  }

  const rows = await getDb()
    .select({
      ...nodeSelection,
      alias: knowledgeAliases.alias,
    })
    .from(knowledgeNodes)
    .leftJoin(
      knowledgeNodeProgress,
      eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
    )
    .leftJoin(knowledgeAliases, eq(knowledgeAliases.nodeId, knowledgeNodes.id))
    .where(and(...conditions))
    .orderBy(
      asc(knowledgeNodes.domainSlug),
      asc(knowledgeNodes.level),
      asc(knowledgeNodes.sortOrder),
      asc(knowledgeNodes.name),
    )
    .limit(240);

  const byId = new Map<string, KnowledgeSearchResult>();

  for (const row of rows) {
    const existing = byId.get(row.id);

    if (existing) {
      if (row.alias && !existing.matchedAliases.includes(row.alias)) {
        existing.matchedAliases.push(row.alias);
      }
      continue;
    }

    byId.set(row.id, {
      ...row,
      level: row.level as KnowledgeNodeLevel,
      status: row.status as KnowledgeProgressStatus,
      matchedAliases: row.alias ? [row.alias] : [],
    });
  }

  return [...byId.values()].slice(0, 100);
}

export async function getKnowledgeDomainOverview({
  domainSlug,
  selectedSlug,
}: {
  domainSlug: string;
  selectedSlug?: string;
}): Promise<KnowledgeDomainOverview | null> {
  const rows = await getDb()
    .select(nodeSelection)
    .from(knowledgeNodes)
    .leftJoin(
      knowledgeNodeProgress,
      eq(knowledgeNodeProgress.nodeId, knowledgeNodes.id),
    )
    .where(
      and(
        eq(knowledgeNodes.domainSlug, domainSlug),
        ne(knowledgeNodes.curationStatus, "deprecated"),
      ),
    )
    .orderBy(
      asc(knowledgeNodes.level),
      asc(knowledgeNodes.sortOrder),
      asc(knowledgeNodes.name),
    );

  const nodes: KnowledgeNodeSummary[] = rows.map((row) => ({
    ...row,
    level: row.level as KnowledgeNodeLevel,
    status: row.status as KnowledgeProgressStatus,
  }));
  const domain = nodes.find((node) => node.level === "domain");

  if (!domain) {
    return null;
  }

  const selectedNode =
    nodes.find((node) => node.slug === selectedSlug) ?? domain;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const tree = buildTree(nodes);
  const domainTree = tree.find((node) => node.id === domain.id);
  const [aliases, edges] = await Promise.all([
    listKnowledgeAliases(selectedNode.id),
    listKnowledgeEdges(selectedNode.id, nodeIds),
  ]);

  return {
    domain: domainTree ?? { ...domain, children: [] },
    nodes,
    selectedNode,
    tree,
    aliases,
    edges,
    counts: countNodes(nodes),
    knowledgeAreaCounts: getKnowledgeAreaCounts(domain.id, nodes),
  };
}

function buildTree(nodes: KnowledgeNodeSummary[]) {
  const byId = new Map<string, KnowledgeTreeNode>();

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: KnowledgeTreeNode[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (items: KnowledgeTreeNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    items.forEach((item) => sortChildren(item.children));
  };

  sortChildren(roots);

  return roots;
}

function countNodes(nodes: KnowledgeNodeSummary[]) {
  const counts = normalizeCounts();

  for (const node of nodes) {
    incrementCount(counts, node.status);
  }

  return counts;
}

function getDescendantIds(
  rootId: string,
  childrenByParent: Map<string, KnowledgeNodeSummary[]>,
) {
  const ids = new Set<string>([rootId]);
  const stack = [...(childrenByParent.get(rootId) ?? [])];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!node || ids.has(node.id)) {
      continue;
    }

    ids.add(node.id);
    stack.push(...(childrenByParent.get(node.id) ?? []));
  }

  return ids;
}

function getKnowledgeAreaCounts(domainId: string, nodes: KnowledgeNodeSummary[]) {
  const childrenByParent = new Map<string, KnowledgeNodeSummary[]>();

  for (const node of nodes) {
    if (!node.parentId) {
      continue;
    }

    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node);
    childrenByParent.set(node.parentId, children);
  }

  const knowledgeAreas = (childrenByParent.get(domainId) ?? [])
    .filter((node) => node.level === "knowledge_area")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return knowledgeAreas.map((area) => {
    const descendantIds = getDescendantIds(area.id, childrenByParent);

    return {
      id: area.id,
      slug: area.slug,
      name: area.name,
      counts: countNodes(nodes.filter((node) => descendantIds.has(node.id))),
    };
  });
}

async function listKnowledgeAliases(nodeId: string) {
  const rows = await getDb()
    .select({ alias: knowledgeAliases.alias })
    .from(knowledgeAliases)
    .where(eq(knowledgeAliases.nodeId, nodeId))
    .orderBy(asc(knowledgeAliases.alias));

  return rows.map((row) => row.alias);
}

async function listKnowledgeEdges(
  nodeId: string,
  localNodeIds: Set<string>,
): Promise<KnowledgeEdgeView[]> {
  const fromNode = alias(knowledgeNodes, "from_node");
  const toNode = alias(knowledgeNodes, "to_node");

  const rows = await getDb()
    .select({
      id: knowledgeEdges.id,
      fromNodeId: knowledgeEdges.fromNodeId,
      toNodeId: knowledgeEdges.toNodeId,
      relationType: knowledgeEdges.relationType,
      reason: knowledgeEdges.reason,
      edgeScope: knowledgeEdges.edgeScope,
      fromOtherId: fromNode.id,
      fromDomainSlug: fromNode.domainSlug,
      fromSlug: fromNode.slug,
      fromName: fromNode.name,
      fromLevel: fromNode.level,
      toOtherId: toNode.id,
      toDomainSlug: toNode.domainSlug,
      toSlug: toNode.slug,
      toName: toNode.name,
      toLevel: toNode.level,
    })
    .from(knowledgeEdges)
    .innerJoin(fromNode, eq(knowledgeEdges.fromNodeId, fromNode.id))
    .innerJoin(toNode, eq(knowledgeEdges.toNodeId, toNode.id))
    .where(or(eq(knowledgeEdges.fromNodeId, nodeId), eq(knowledgeEdges.toNodeId, nodeId)))
    .orderBy(asc(knowledgeEdges.relationType), asc(knowledgeEdges.reason));

  return rows
    .map((row) => {
      const isOutgoing = row.fromNodeId === nodeId;

      return {
        id: row.id,
        direction: isOutgoing ? "outgoing" : "incoming",
        relationType: row.relationType,
        reason: row.reason,
        edgeScope: localNodeIds.has(isOutgoing ? row.toOtherId : row.fromOtherId)
          ? "local"
          : row.edgeScope,
        otherNode: {
          id: isOutgoing ? row.toOtherId : row.fromOtherId,
          domainSlug: isOutgoing ? row.toDomainSlug : row.fromDomainSlug,
          slug: isOutgoing ? row.toSlug : row.fromSlug,
          name: isOutgoing ? row.toName : row.fromName,
          level: (isOutgoing ? row.toLevel : row.fromLevel) as KnowledgeNodeLevel,
        },
      } satisfies KnowledgeEdgeView;
    })
    .filter((edge) => edge.otherNode.id !== nodeId);
}
