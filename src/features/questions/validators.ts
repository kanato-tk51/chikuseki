import { z } from "zod";

import type { QuestionCard } from "@/db/schema";

export const difficultyLevels = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = (typeof difficultyLevels)[number];

export const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const questionStatuses = ["draft", "active", "archived"] as const;
export type QuestionStatus = (typeof questionStatuses)[number];

export const questionStatusLabels: Record<QuestionStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const questionFormFields = [
  "title",
  "difficulty",
  "status",
  "questionMd",
  "answerMd",
  "explanationMd",
] as const;

export type QuestionFormField = (typeof questionFormFields)[number];
export type QuestionFormData = Record<QuestionFormField, string>;
export type QuestionFormErrors = Partial<Record<QuestionFormField, string[]>>;

export type QuestionFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: QuestionFormErrors;
  values?: QuestionFormData;
};

const markdownFieldSchema = (maxLength: number) =>
  z
    .string()
    .max(maxLength, `${maxLength}文字以内で入力してください`)
    .transform((value) => value.trim());

export const questionIdSchema = z.uuid();

export const questionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(300, "タイトルは300文字以内で入力してください"),
  difficulty: z.enum(difficultyLevels),
  status: z.enum(questionStatuses),
  questionMd: markdownFieldSchema(50000),
  answerMd: markdownFieldSchema(50000),
  explanationMd: markdownFieldSchema(50000),
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

export const emptyQuestionFormData: QuestionFormData = {
  title: "",
  difficulty: "medium",
  status: "draft",
  questionMd: "",
  answerMd: "",
  explanationMd: "",
};

export const initialQuestionFormState: QuestionFormState = {
  status: "idle",
};

function readFormString(formData: FormData, field: QuestionFormField) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export function readQuestionFormData(formData: FormData): QuestionFormData {
  return {
    title: readFormString(formData, "title"),
    difficulty: readFormString(formData, "difficulty"),
    status: readFormString(formData, "status"),
    questionMd: readFormString(formData, "questionMd"),
    answerMd: readFormString(formData, "answerMd"),
    explanationMd: readFormString(formData, "explanationMd"),
  };
}

export function questionToFormData(
  question: Pick<
    QuestionCard,
    | "title"
    | "difficulty"
    | "status"
    | "questionMd"
    | "answerMd"
    | "explanationMd"
  >,
): QuestionFormData {
  return {
    title: question.title,
    difficulty: question.difficulty,
    status: question.status,
    questionMd: question.questionMd,
    answerMd: question.answerMd,
    explanationMd: question.explanationMd,
  };
}
