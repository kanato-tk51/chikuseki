import { z } from "zod";

export const knowledgeLinkerModes = ["text", "lookup"] as const;
export const knowledgeLinkableEntityTypes = [
  "resource",
  "learning_note",
  "question_card",
] as const;

export type KnowledgeLinkerMode = (typeof knowledgeLinkerModes)[number];
export type KnowledgeLinkableEntityType =
  (typeof knowledgeLinkableEntityTypes)[number];

export const knowledgeLinkableEntityTypeLabels: Record<
  KnowledgeLinkableEntityType,
  string
> = {
  resource: "Resource",
  learning_note: "Note",
  question_card: "Question",
};

export const knowledgeLinkerRequestSchema = z
  .object({
    text: z
      .string()
      .trim()
      .max(50000, "照合するテキストは50000文字以内で入力してください"),
    mode: z.enum(knowledgeLinkerModes).default("text"),
    domainSlug: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    limit: z.coerce.number().int().min(5).max(80).default(30),
  })
  .superRefine((value, ctx) => {
    const minimumLength = value.mode === "lookup" ? 2 : 10;

    if (value.text.length < minimumLength) {
      ctx.addIssue({
        code: "custom",
        path: ["text"],
        message:
          value.mode === "lookup"
            ? "Lookup では2文字以上で入力してください"
            : "照合するテキストを10文字以上で入力してください",
      });
    }
  });

export const knowledgeLinkSaveRequestSchema = z.object({
  entityType: z.enum(knowledgeLinkableEntityTypes),
  entityId: z.uuid(),
  nodeIds: z.array(z.uuid()).min(1).max(80),
  relationType: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .default("covers"),
});

export type KnowledgeLinkerRequest = z.infer<
  typeof knowledgeLinkerRequestSchema
>;
export type KnowledgeLinkSaveRequest = z.infer<
  typeof knowledgeLinkSaveRequestSchema
>;
