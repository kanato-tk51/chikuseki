import { z } from "zod";

import {
  learningNoteTypes,
  type LearningNoteType,
} from "@/features/notes/validators";
import {
  difficultyLevels,
  questionStatuses,
} from "@/features/questions/validators";
import { resourceTypes } from "@/features/resources/validators";
import { chatGptImportPayloadVersion } from "@/features/imports/chatgpt-template";

export type ChatGptImportFormData = {
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

const optionalUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, context) => {
    const text = typeof value === "string" ? value.trim() : "";

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

const markdownSchema = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} は${maxLength}文字以内で入力してください`);

const sourceSchema = z
  .object({
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
  })
  .nullable()
  .optional()
  .transform((value) => value ?? null);

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

export const chatGptImportPayloadSchema = z.object({
  version: z.literal(chatGptImportPayloadVersion),
  source: sourceSchema,
  note: noteSchema,
  questions: z.array(questionSchema).max(20).default([]),
});

export type ChatGptImportPayload = z.infer<
  typeof chatGptImportPayloadSchema
>;
export type ImportedNoteValues = {
  title: string;
  noteType: LearningNoteType;
  bodyMd: string;
};

export function readChatGptImportFormData(
  formData: FormData,
): ChatGptImportFormData {
  const payload = formData.get("payload");

  return {
    payload: typeof payload === "string" ? payload : "",
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
