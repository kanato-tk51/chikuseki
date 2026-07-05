import { z } from "zod";

export const knowledgeProgressStatuses = [
  "unknown",
  "interested",
  "learning",
  "understood",
  "ignored",
] as const;

export type KnowledgeProgressStatus = (typeof knowledgeProgressStatuses)[number];

export const knowledgeProgressStatusLabels: Record<
  KnowledgeProgressStatus,
  string
> = {
  unknown: "Unknown",
  interested: "Interested",
  learning: "Learning",
  understood: "Understood",
  ignored: "Ignored",
};

export const knowledgeNodeLevels = [
  "domain",
  "knowledge_area",
  "topic_cluster",
  "concept",
  "term",
] as const;

export type KnowledgeNodeLevel = (typeof knowledgeNodeLevels)[number];

export const knowledgeNodeLevelLabels: Record<KnowledgeNodeLevel, string> = {
  domain: "Domain",
  knowledge_area: "Knowledge Area",
  topic_cluster: "Topic Cluster",
  concept: "Concept",
  term: "Term",
};

export const knowledgeNodeIdSchema = z.uuid();

export const knowledgeProgressFormSchema = z.object({
  nodeId: knowledgeNodeIdSchema,
  status: z.enum(knowledgeProgressStatuses),
  interestLevel: z.coerce.number().int().min(0).max(5),
  memo: z
    .string()
    .max(4000, "Memo は4000文字以内で入力してください")
    .transform((value) => {
      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    }),
  returnTo: z
    .string()
    .trim()
    .refine((value) => value.startsWith("/knowledge-map"), {
      message: "returnTo が不正です",
    }),
});

export type KnowledgeProgressFormValues = z.infer<
  typeof knowledgeProgressFormSchema
>;

export function readKnowledgeProgressFormData(formData: FormData) {
  return {
    nodeId: formData.get("nodeId"),
    status: formData.get("status"),
    interestLevel: formData.get("interestLevel"),
    memo: typeof formData.get("memo") === "string" ? formData.get("memo") : "",
    returnTo:
      typeof formData.get("returnTo") === "string"
        ? formData.get("returnTo")
        : "/knowledge-map",
  };
}
