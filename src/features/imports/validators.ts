import { z } from "zod";

import { learningNoteTypes } from "@/features/notes/validators";
import {
  difficultyLevels,
  questionStatuses,
} from "@/features/questions/validators";
import { resourceTypes } from "@/features/resources/validators";

export const chatGptImportPayloadVersion = "chikuseki.chatgpt_import.v1";

export type ChatGptImportFormData = {
  conversationUrl: string;
  payload: string;
};

export type ChatGptImportFormErrors = Partial<
  Record<keyof ChatGptImportFormData, string[]>
>;

export type ChatGptImportFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: ChatGptImportFormErrors;
  values?: ChatGptImportFormData;
};

export const initialChatGptImportFormState: ChatGptImportFormState = {
  status: "idle",
};

const optionalTextSchema = (maxLength: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value, context) => {
      const text = typeof value === "string" ? value.trim() : "";

      if (text.length > maxLength) {
        context.addIssue({
          code: "custom",
          message: `${maxLength}文字以内で入力してください`,
        });

        return z.NEVER;
      }

      return text.length > 0 ? text : null;
    });

function normalizeUrlText(value: string) {
  const trimmed = value.trim();
  const markdownLinkMatch = /^\[[^\]]+\]\((https?:\/\/[^)\s]+)\)$/.exec(
    trimmed,
  );

  return markdownLinkMatch?.[1] ?? trimmed;
}

const optionalUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, context) => {
    const text =
      typeof value === "string" ? normalizeUrlText(value) : "";

    if (text.length === 0) {
      return null;
    }

    if (text.length > 2048) {
      context.addIssue({
        code: "custom",
        message: "URL は2048文字以内で入力してください",
      });

      return z.NEVER;
    }

    try {
      const url = new URL(text);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }

      return text;
    } catch {
      context.addIssue({
        code: "custom",
        message: "source.url は http または https の URL にしてください",
      });

      return z.NEVER;
    }
  });

const conversationUrlSchema = z
  .string()
  .trim()
  .max(2048, "Chat URL は2048文字以内で入力してください")
  .transform((value, context) => {
    const text = normalizeUrlText(value);

    if (text.length === 0) {
      return null;
    }

    try {
      const url = new URL(text);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }

      return text;
    } catch {
      context.addIssue({
        code: "custom",
        message: "Chat URL は http または https の URL にしてください",
      });

      return z.NEVER;
    }
  });

const markdownSchema = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} は${maxLength}文字以内で入力してください`);

const sourceKeySchema = z
  .string()
  .trim()
  .min(1, "sources[].key は必須です")
  .max(80, "sources[].key は80文字以内で入力してください")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "sources[].key は英数字、ハイフン、アンダースコアで入力してください",
  );

const baseSourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "source.title は必須です")
    .max(300, "source.title は300文字以内で入力してください"),
  type: z.enum(resourceTypes).default("other"),
  url: optionalUrlSchema,
  sourceName: optionalTextSchema(200),
  author: optionalTextSchema(200),
  summary: optionalTextSchema(4000),
  memo: optionalTextSchema(4000),
});

const keyedSourceSchema = baseSourceSchema.extend({
  key: sourceKeySchema,
});

const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "note.title は必須です")
    .max(300, "note.title は300文字以内で入力してください"),
  noteType: z.enum(learningNoteTypes).default("other"),
  bodyMd: markdownSchema(50000, "note.bodyMd").min(
    1,
    "note.bodyMd は必須です",
  ),
});

const questionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "questions[].title は必須です")
    .max(300, "questions[].title は300文字以内で入力してください"),
  questionMd: markdownSchema(50000, "questions[].questionMd").min(
    1,
    "questions[].questionMd は必須です",
  ),
  answerMd: markdownSchema(50000, "questions[].answerMd").min(
    1,
    "questions[].answerMd は必須です",
  ),
  explanationMd: markdownSchema(50000, "questions[].explanationMd").default(
    "",
  ),
  difficulty: z.enum(difficultyLevels).default("medium"),
  status: z.enum(questionStatuses).default("draft"),
});

const importItemSchema = z.object({
  sourceKeys: z.array(sourceKeySchema).max(10).default([]),
  note: noteSchema,
  questions: z.array(questionSchema).max(20).default([]),
});

export const chatGptImportPayloadSchema = z.object({
  version: z.literal(chatGptImportPayloadVersion),
  sources: z.array(keyedSourceSchema).max(20).default([]),
  items: z.array(importItemSchema).min(1).max(30),
}).superRefine((payload, context) => {
  const sourceKeys = new Set<string>();

  payload.sources.forEach((source, index) => {
    if (sourceKeys.has(source.key)) {
      context.addIssue({
        code: "custom",
        path: ["sources", index, "key"],
        message: "sources[].key が重複しています",
      });
    }

    sourceKeys.add(source.key);
  });

  payload.items.forEach((item, itemIndex) => {
    const itemSourceKeys = new Set<string>();

    item.sourceKeys.forEach((sourceKey, sourceKeyIndex) => {
      if (itemSourceKeys.has(sourceKey)) {
        context.addIssue({
          code: "custom",
          path: ["items", itemIndex, "sourceKeys", sourceKeyIndex],
          message: "items[].sourceKeys が重複しています",
        });
      }

      if (!sourceKeys.has(sourceKey)) {
        context.addIssue({
          code: "custom",
          path: ["items", itemIndex, "sourceKeys", sourceKeyIndex],
          message: "sources に存在する key を指定してください",
        });
      }

      itemSourceKeys.add(sourceKey);
    });
  });
});

export type ChatGptImportPayload = z.infer<
  typeof chatGptImportPayloadSchema
>;

export function readChatGptImportFormData(
  formData: FormData,
): ChatGptImportFormData {
  const conversationUrl = formData.get("conversationUrl");
  const payload = formData.get("payload");

  return {
    conversationUrl:
      typeof conversationUrl === "string" ? conversationUrl : "",
    payload: typeof payload === "string" ? payload : "",
  };
}

export function parseChatGptConversationUrl(value: string) {
  const parsed = conversationUrlSchema.safeParse(value);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues
        .map((issue) => issue.message)
        .join("\n"),
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);

  return match ? match[1].trim() : trimmed;
}

export function parseChatGptImportPayload(value: string) {
  const stripped = stripJsonFence(value);

  if (!stripped) {
    return {
      success: false as const,
      error: "ChatGPT の JSON 出力を貼り付けてください",
    };
  }

  try {
    const json = JSON.parse(stripped) as unknown;
    const parsed = chatGptImportPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
          .join("\n"),
      };
    }

    return {
      success: true as const,
      data: parsed.data,
    };
  } catch {
    return {
      success: false as const,
      error: "JSON として解析できませんでした",
    };
  }
}
