import { z } from "zod";

import type { Resource } from "@/db/schema";

export const resourceTypes = [
  "article",
  "book",
  "talk",
  "video",
  "docs",
  "repository",
  "other",
] as const;

export type ResourceType = (typeof resourceTypes)[number];

export const resourceTypeLabels: Record<ResourceType, string> = {
  article: "Article",
  book: "Book",
  talk: "Talk",
  video: "Video",
  docs: "Docs",
  repository: "Repository",
  other: "Other",
};

export const resourceFormFields = [
  "title",
  "type",
  "url",
  "sourceName",
  "author",
  "summary",
  "memo",
  "publishedAt",
  "consumedAt",
] as const;

export type ResourceFormField = (typeof resourceFormFields)[number];
export type ResourceFormData = Record<ResourceFormField, string>;
export type ResourceFormErrors = Partial<Record<ResourceFormField, string[]>>;

export type ResourceFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: ResourceFormErrors;
  values?: ResourceFormData;
};

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `${maxLength}文字以内で入力してください`)
    .transform((value) => (value.length > 0 ? value : null));

const optionalUrlSchema = z
  .string()
  .trim()
  .max(2048, "URL は2048文字以内で入力してください")
  .transform((value, context) => {
    if (value.length === 0) {
      return null;
    }

    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }

      return value;
    } catch {
      context.addIssue({
        code: "custom",
        message: "http または https の URL を入力してください",
      });

      return z.NEVER;
    }
  });

const optionalDateSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    if (value.length === 0) {
      return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      context.addIssue({
        code: "custom",
        message: "有効な日付を入力してください",
      });

      return z.NEVER;
    }

    return date;
  });

export const resourceIdSchema = z.uuid();

export const resourceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(300, "タイトルは300文字以内で入力してください"),
  type: z.enum(resourceTypes),
  url: optionalUrlSchema,
  sourceName: optionalTextSchema(200),
  author: optionalTextSchema(200),
  summary: optionalTextSchema(4000),
  memo: optionalTextSchema(4000),
  publishedAt: optionalDateSchema,
  consumedAt: optionalDateSchema,
});

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;

export const emptyResourceFormData: ResourceFormData = {
  title: "",
  type: "article",
  url: "",
  sourceName: "",
  author: "",
  summary: "",
  memo: "",
  publishedAt: "",
  consumedAt: "",
};

export const initialResourceFormState: ResourceFormState = {
  status: "idle",
};

function readFormString(formData: FormData, field: ResourceFormField) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function formatDateForInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function readResourceFormData(formData: FormData): ResourceFormData {
  return {
    title: readFormString(formData, "title"),
    type: readFormString(formData, "type"),
    url: readFormString(formData, "url"),
    sourceName: readFormString(formData, "sourceName"),
    author: readFormString(formData, "author"),
    summary: readFormString(formData, "summary"),
    memo: readFormString(formData, "memo"),
    publishedAt: readFormString(formData, "publishedAt"),
    consumedAt: readFormString(formData, "consumedAt"),
  };
}

export function resourceToFormData(resource: Resource): ResourceFormData {
  return {
    title: resource.title,
    type: resource.type,
    url: resource.url ?? "",
    sourceName: resource.sourceName ?? "",
    author: resource.author ?? "",
    summary: resource.summary ?? "",
    memo: resource.memo ?? "",
    publishedAt: formatDateForInput(resource.publishedAt),
    consumedAt: formatDateForInput(resource.consumedAt),
  };
}
