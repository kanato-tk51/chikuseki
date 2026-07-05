import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const resourceTypeEnum = pgEnum("resource_type", [
  "article",
  "book",
  "talk",
  "video",
  "docs",
  "repository",
  "other",
]);

export const learningNoteTypeEnum = pgEnum("learning_note_type", [
  "resource",
  "project",
  "concept",
  "other",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const questionStatusEnum = pgEnum("question_status", [
  "draft",
  "active",
  "archived",
]);

export const reviewTargetTypeEnum = pgEnum("review_target_type", [
  "question_card",
  "code_problem",
]);

export const reviewResultEnum = pgEnum("review_result", [
  "again",
  "hard",
  "good",
  "easy",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "resource",
  "learning_note",
  "question_card",
  "code_problem",
  "project",
  "project_log",
  "concept",
  "output",
]);

export const knowledgeNodeLevelEnum = pgEnum("knowledge_node_level", [
  "domain",
  "knowledge_area",
  "topic_cluster",
  "concept",
  "term",
]);

export const knowledgeCurationStatusEnum = pgEnum(
  "knowledge_curation_status",
  ["draft", "reviewed", "deprecated"],
);

export const knowledgeProgressStatusEnum = pgEnum(
  "knowledge_progress_status",
  ["unknown", "interested", "learning", "understood", "ignored"],
);

export const knowledgeRelationTypeEnum = pgEnum("knowledge_relation_type", [
  "related",
  "prerequisite",
  "compare_with",
  "used_in",
  "broader",
  "narrower",
]);

export const knowledgeSearchKeywordTypeEnum = pgEnum(
  "knowledge_search_keyword_type",
  ["keyword", "common_signal", "anti_signal"],
);

export const knowledgeRelatedItemTypeEnum = pgEnum(
  "knowledge_related_item_type",
  [
    "library",
    "framework",
    "tool",
    "standard",
    "protocol",
    "service",
    "platform",
    "pattern",
    "language",
    "method",
    "other",
  ],
);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: resourceTypeEnum("type").notNull().default("article"),
    title: text("title").notNull(),
    url: text("url"),
    sourceName: text("source_name"),
    author: text("author"),
    summary: text("summary"),
    memo: text("memo"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("resources_type_idx").on(table.type),
    index("resources_created_at_idx").on(table.createdAt),
  ],
);

export const learningNotes = pgTable(
  "learning_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    bodyMd: text("body_md").notNull().default(""),
    noteType: learningNoteTypeEnum("note_type").notNull().default("resource"),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("learning_notes_resource_id_idx").on(table.resourceId),
    index("learning_notes_created_at_idx").on(table.createdAt),
  ],
);

export const questionCards = pgTable(
  "question_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    questionMd: text("question_md").notNull().default(""),
    answerMd: text("answer_md").notNull().default(""),
    explanationMd: text("explanation_md").notNull().default(""),
    difficulty: difficultyEnum("difficulty").notNull().default("medium"),
    status: questionStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => [
    index("question_cards_status_idx").on(table.status),
    index("question_cards_created_at_idx").on(table.createdAt),
  ],
);

export const reviewItems = pgTable(
  "review_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: reviewTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    intervalDays: integer("interval_days").notNull().default(0),
    ease: doublePrecision("ease").notNull().default(2.5),
    lastResult: reviewResultEnum("last_result"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("review_items_target_unique").on(
      table.targetType,
      table.targetId,
    ),
    index("review_items_next_review_at_idx").on(table.nextReviewAt),
  ],
);

export const reviewLogs = pgTable(
  "review_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewItemId: uuid("review_item_id")
      .notNull()
      .references(() => reviewItems.id, { onDelete: "cascade" }),
    result: reviewResultEnum("result").notNull(),
    memo: text("memo"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("review_logs_review_item_id_idx").on(table.reviewItemId),
    index("review_logs_reviewed_at_idx").on(table.reviewedAt),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const entityTags = pgTable(
  "entity_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entity_tags_entity_tag_unique").on(
      table.entityType,
      table.entityId,
      table.tagId,
    ),
    index("entity_tags_entity_idx").on(table.entityType, table.entityId),
    index("entity_tags_tag_id_idx").on(table.tagId),
  ],
);

export const entityLinks = pgTable(
  "entity_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromType: entityTypeEnum("from_type").notNull(),
    fromId: uuid("from_id").notNull(),
    toType: entityTypeEnum("to_type").notNull(),
    toId: uuid("to_id").notNull(),
    relationType: text("relation_type").notNull().default("related"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entity_links_relation_unique").on(
      table.fromType,
      table.fromId,
      table.toType,
      table.toId,
      table.relationType,
    ),
    index("entity_links_from_idx").on(table.fromType, table.fromId),
    index("entity_links_to_idx").on(table.toType, table.toId),
  ],
);

export const knowledgeNodes = pgTable(
  "knowledge_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeKey: text("node_key").notNull(),
    domainSlug: text("domain_slug").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    level: knowledgeNodeLevelEnum("level").notNull(),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => knowledgeNodes.id,
      { onDelete: "set null" },
    ),
    summary: text("summary").notNull(),
    whyLearn: text("why_learn"),
    promptHint: text("prompt_hint"),
    boundaryNotes: text("boundary_notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    curationStatus: knowledgeCurationStatusEnum("curation_status")
      .notNull()
      .default("draft"),
    sourceFile: text("source_file").notNull(),
    contentHash: text("content_hash").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_nodes_node_key_unique").on(table.nodeKey),
    uniqueIndex("knowledge_nodes_domain_slug_unique").on(
      table.domainSlug,
      table.slug,
    ),
    index("knowledge_nodes_domain_idx").on(table.domainSlug),
    index("knowledge_nodes_level_idx").on(table.level),
    index("knowledge_nodes_parent_id_idx").on(table.parentId),
  ],
);

export const knowledgeAliases = pgTable(
  "knowledge_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_aliases_node_alias_unique").on(
      table.nodeId,
      table.alias,
    ),
    index("knowledge_aliases_node_id_idx").on(table.nodeId),
    index("knowledge_aliases_alias_idx").on(table.alias),
  ],
);

export const knowledgeNodeSearchDocuments = pgTable(
  "knowledge_node_search_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    searchText: text("search_text").notNull(),
    contentHash: text("content_hash").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_node_search_documents_node_unique").on(table.nodeId),
    index("knowledge_node_search_documents_node_id_idx").on(table.nodeId),
  ],
);

export const knowledgeNodeSearchKeywords = pgTable(
  "knowledge_node_search_keywords",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    keywordType: knowledgeSearchKeywordTypeEnum("keyword_type")
      .notNull()
      .default("keyword"),
    sourceFile: text("source_file").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_node_search_keywords_unique").on(
      table.nodeId,
      table.keyword,
      table.keywordType,
    ),
    index("knowledge_node_search_keywords_node_id_idx").on(table.nodeId),
    index("knowledge_node_search_keywords_keyword_idx").on(table.keyword),
    index("knowledge_node_search_keywords_type_idx").on(table.keywordType),
  ],
);

export const knowledgeRelatedItems = pgTable(
  "knowledge_related_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    itemType: knowledgeRelatedItemTypeEnum("item_type").notNull(),
    officialUrl: text("official_url"),
    contentHash: text("content_hash").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_related_items_name_type_unique").on(
      table.name,
      table.itemType,
    ),
    index("knowledge_related_items_name_idx").on(table.name),
    index("knowledge_related_items_type_idx").on(table.itemType),
  ],
);

export const knowledgeNodeRelatedItems = pgTable(
  "knowledge_node_related_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    relatedItemId: uuid("related_item_id")
      .notNull()
      .references(() => knowledgeRelatedItems.id, { onDelete: "cascade" }),
    relevance: text("relevance").notNull(),
    sourceFile: text("source_file").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_node_related_items_unique").on(
      table.nodeId,
      table.relatedItemId,
    ),
    index("knowledge_node_related_items_node_id_idx").on(table.nodeId),
    index("knowledge_node_related_items_related_item_id_idx").on(
      table.relatedItemId,
    ),
  ],
);

export const knowledgeEdges = pgTable(
  "knowledge_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromNodeId: uuid("from_node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    toNodeId: uuid("to_node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    fromRef: text("from_ref").notNull(),
    toRef: text("to_ref").notNull(),
    relationType: knowledgeRelationTypeEnum("relation_type").notNull(),
    reason: text("reason").notNull(),
    edgeScope: text("edge_scope").notNull().default("local"),
    sourceFile: text("source_file").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_edges_relation_unique").on(
      table.fromNodeId,
      table.toNodeId,
      table.relationType,
    ),
    index("knowledge_edges_from_node_id_idx").on(table.fromNodeId),
    index("knowledge_edges_to_node_id_idx").on(table.toNodeId),
    index("knowledge_edges_relation_type_idx").on(table.relationType),
  ],
);

export const knowledgeNodeProgress = pgTable(
  "knowledge_node_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    status: knowledgeProgressStatusEnum("status")
      .notNull()
      .default("unknown"),
    interestLevel: integer("interest_level").notNull().default(0),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    memo: text("memo"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_node_progress_node_unique").on(table.nodeId),
    index("knowledge_node_progress_status_idx").on(table.status),
  ],
);

export const knowledgeEntityLinks = pgTable(
  "knowledge_entity_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    relationType: text("relation_type").notNull().default("related"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_entity_links_unique").on(
      table.nodeId,
      table.entityType,
      table.entityId,
      table.relationType,
    ),
    index("knowledge_entity_links_node_id_idx").on(table.nodeId),
    index("knowledge_entity_links_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
  ],
);

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type LearningNote = typeof learningNotes.$inferSelect;
export type NewLearningNote = typeof learningNotes.$inferInsert;
export type QuestionCard = typeof questionCards.$inferSelect;
export type NewQuestionCard = typeof questionCards.$inferInsert;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type NewKnowledgeNode = typeof knowledgeNodes.$inferInsert;
export type KnowledgeRelatedItem = typeof knowledgeRelatedItems.$inferSelect;
export type NewKnowledgeRelatedItem = typeof knowledgeRelatedItems.$inferInsert;
