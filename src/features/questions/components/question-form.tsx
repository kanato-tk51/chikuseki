"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  difficultyLabels,
  difficultyLevels,
  emptyQuestionFormData,
  initialQuestionFormState,
  questionStatusLabels,
  questionStatuses,
  type QuestionFormData,
  type QuestionFormField,
  type QuestionFormState,
} from "@/features/questions/validators";

type QuestionFormAction = (
  previousState: QuestionFormState,
  formData: FormData,
) => Promise<QuestionFormState>;

type QuestionFormProps = {
  action: QuestionFormAction;
  cancelHref: string;
  submitLabel: string;
  initialValues?: QuestionFormData;
};

const inputClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const textareaClassName =
  "min-h-56 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function FieldError({
  errors,
  id,
}: {
  errors?: QuestionFormState["errors"];
  id: QuestionFormField;
}) {
  const messages = errors?.[id];

  if (!messages?.length) {
    return null;
  }

  return (
    <p id={`${id}-error`} className="text-xs text-destructive">
      {messages[0]}
    </p>
  );
}

function Field({
  id,
  label,
  children,
  errors,
}: {
  id: QuestionFormField;
  label: string;
  children: React.ReactNode;
  errors?: QuestionFormState["errors"];
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      <FieldError errors={errors} id={id} />
    </div>
  );
}

export function QuestionForm({
  action,
  cancelHref,
  submitLabel,
  initialValues = emptyQuestionFormData,
}: QuestionFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialQuestionFormState,
  );
  const values = state.values ?? initialValues;
  const errors = state.errors;

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
        <Field id="title" label="Title" errors={errors}>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            aria-invalid={Boolean(errors?.title)}
            aria-describedby={errors?.title ? "title-error" : undefined}
            className={inputClassName}
            placeholder="例: Server Actions の validation はどこで行う？"
          />
        </Field>

        <Field id="difficulty" label="Difficulty" errors={errors}>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={values.difficulty}
            aria-invalid={Boolean(errors?.difficulty)}
            aria-describedby={
              errors?.difficulty ? "difficulty-error" : undefined
            }
            className={inputClassName}
          >
            {difficultyLevels.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficultyLabels[difficulty]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="status" label="Status" errors={errors}>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            aria-invalid={Boolean(errors?.status)}
            aria-describedby={errors?.status ? "status-error" : undefined}
            className={inputClassName}
          >
            {questionStatuses.map((status) => (
              <option key={status} value={status}>
                {questionStatusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="questionMd" label="Question" errors={errors}>
        <textarea
          id="questionMd"
          name="questionMd"
          defaultValue={values.questionMd}
          aria-invalid={Boolean(errors?.questionMd)}
          aria-describedby={
            errors?.questionMd ? "questionMd-error" : undefined
          }
          className={textareaClassName}
          placeholder="復習時に表示する問い"
        />
      </Field>

      <Field id="answerMd" label="Answer" errors={errors}>
        <textarea
          id="answerMd"
          name="answerMd"
          defaultValue={values.answerMd}
          aria-invalid={Boolean(errors?.answerMd)}
          aria-describedby={errors?.answerMd ? "answerMd-error" : undefined}
          className={textareaClassName}
          placeholder="自分が思い出したい答え"
        />
      </Field>

      <Field id="explanationMd" label="Explanation" errors={errors}>
        <textarea
          id="explanationMd"
          name="explanationMd"
          defaultValue={values.explanationMd}
          aria-invalid={Boolean(errors?.explanationMd)}
          aria-describedby={
            errors?.explanationMd ? "explanationMd-error" : undefined
          }
          className={textareaClassName}
          placeholder="補足、根拠、関連する注意点"
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
