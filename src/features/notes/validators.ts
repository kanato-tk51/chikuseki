import { z } from "zod";

import type { LearningNote } from "@/db/schema";

export const learningNoteTypes = [
  "resource",
  "project",
  "concept",
  "other",
] as const;

export type LearningNoteType = (typeof learningNoteTypes)[number];

export const learningNoteTypeLabels: Record<LearningNoteType, string> = {
  resource: "Resource",
  project: "Project",
  concept: "Concept",
  other: "Other",
};

export const noteFormFields = [
  "title",
  "noteType",
  "resourceId",
  "bodyMd",
] as const;

export type NoteFormField = (typeof noteFormFields)[number];
export type NoteFormData = Record<NoteFormField, string>;
export type NoteFormErrors = Partial<Record<NoteFormField, string[]>>;

export type NoteFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: NoteFormErrors;
  values?: NoteFormData;
};

const optionalResourceIdSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    if (value.length === 0) {
      return null;
    }

    const parsed = z.uuid().safeParse(value);

    if (!parsed.success) {
      context.addIssue({
        code: "custom",
        message: "Resource ID が不正です",
      });

      return z.NEVER;
    }

    return parsed.data;
  });

export const noteIdSchema = z.uuid();

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(300, "タイトルは300文字以内で入力してください"),
  noteType: z.enum(learningNoteTypes),
  resourceId: optionalResourceIdSchema,
  bodyMd: z
    .string()
    .max(50000, "本文は50000文字以内で入力してください")
    .transform((value) => value.trim()),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export const emptyNoteFormData: NoteFormData = {
  title: "",
  noteType: "resource",
  resourceId: "",
  bodyMd: "",
};

export const initialNoteFormState: NoteFormState = {
  status: "idle",
};

function readFormString(formData: FormData, field: NoteFormField) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export function readNoteFormData(formData: FormData): NoteFormData {
  return {
    title: readFormString(formData, "title"),
    noteType: readFormString(formData, "noteType"),
    resourceId: readFormString(formData, "resourceId"),
    bodyMd: readFormString(formData, "bodyMd"),
  };
}

export function noteToFormData(
  note: Pick<LearningNote, "title" | "noteType" | "resourceId" | "bodyMd">,
): NoteFormData {
  return {
    title: note.title,
    noteType: note.noteType,
    resourceId: note.resourceId ?? "",
    bodyMd: note.bodyMd,
  };
}
