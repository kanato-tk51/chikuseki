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

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type LearningNote = typeof learningNotes.$inferSelect;
export type NewLearningNote = typeof learningNotes.$inferInsert;
export type QuestionCard = typeof questionCards.$inferSelect;
export type NewQuestionCard = typeof questionCards.$inferInsert;
