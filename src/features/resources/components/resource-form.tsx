"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  emptyResourceFormData,
  initialResourceFormState,
  type ResourceFormData,
  type ResourceFormField,
  type ResourceFormState,
  resourceTypeLabels,
  resourceTypes,
} from "@/features/resources/validators";

type ResourceFormAction = (
  previousState: ResourceFormState,
  formData: FormData,
) => Promise<ResourceFormState>;

type ResourceFormProps = {
  action: ResourceFormAction;
  cancelHref: string;
  submitLabel: string;
  initialValues?: ResourceFormData;
};

const inputClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const textareaClassName =
  "min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function FieldError({
  errors,
  id,
}: {
  errors?: ResourceFormState["errors"];
  id: ResourceFormField;
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
  id: ResourceFormField;
  label: string;
  children: React.ReactNode;
  errors?: ResourceFormState["errors"];
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

export function ResourceForm({
  action,
  cancelHref,
  submitLabel,
  initialValues = emptyResourceFormData,
}: ResourceFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialResourceFormState,
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

      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <Field id="title" label="Title" errors={errors}>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            aria-invalid={Boolean(errors?.title)}
            aria-describedby={errors?.title ? "title-error" : undefined}
            className={inputClassName}
            placeholder="例: React Server Components deep dive"
          />
        </Field>

        <Field id="type" label="Type" errors={errors}>
          <select
            id="type"
            name="type"
            defaultValue={values.type}
            aria-invalid={Boolean(errors?.type)}
            aria-describedby={errors?.type ? "type-error" : undefined}
            className={cn(inputClassName, "appearance-auto")}
          >
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {resourceTypeLabels[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="url" label="URL" errors={errors}>
        <input
          id="url"
          name="url"
          type="url"
          defaultValue={values.url}
          aria-invalid={Boolean(errors?.url)}
          aria-describedby={errors?.url ? "url-error" : undefined}
          className={inputClassName}
          placeholder="https://example.com"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="sourceName" label="Source" errors={errors}>
          <input
            id="sourceName"
            name="sourceName"
            type="text"
            defaultValue={values.sourceName}
            aria-invalid={Boolean(errors?.sourceName)}
            aria-describedby={
              errors?.sourceName ? "sourceName-error" : undefined
            }
            className={inputClassName}
            placeholder="例: Vercel Blog"
          />
        </Field>

        <Field id="author" label="Author" errors={errors}>
          <input
            id="author"
            name="author"
            type="text"
            defaultValue={values.author}
            aria-invalid={Boolean(errors?.author)}
            aria-describedby={errors?.author ? "author-error" : undefined}
            className={inputClassName}
            placeholder="例: Jane Doe"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="publishedAt" label="Published at" errors={errors}>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={values.publishedAt}
            aria-invalid={Boolean(errors?.publishedAt)}
            aria-describedby={
              errors?.publishedAt ? "publishedAt-error" : undefined
            }
            className={inputClassName}
          />
        </Field>

        <Field id="consumedAt" label="Consumed at" errors={errors}>
          <input
            id="consumedAt"
            name="consumedAt"
            type="date"
            defaultValue={values.consumedAt}
            aria-invalid={Boolean(errors?.consumedAt)}
            aria-describedby={
              errors?.consumedAt ? "consumedAt-error" : undefined
            }
            className={inputClassName}
          />
        </Field>
      </div>

      <Field id="summary" label="Summary" errors={errors}>
        <textarea
          id="summary"
          name="summary"
          defaultValue={values.summary}
          aria-invalid={Boolean(errors?.summary)}
          aria-describedby={errors?.summary ? "summary-error" : undefined}
          className={textareaClassName}
          placeholder="何についての Resource かを短く残す"
        />
      </Field>

      <Field id="memo" label="Memo" errors={errors}>
        <textarea
          id="memo"
          name="memo"
          defaultValue={values.memo}
          aria-invalid={Boolean(errors?.memo)}
          aria-describedby={errors?.memo ? "memo-error" : undefined}
          className={textareaClassName}
          placeholder="後で見返したい観点や TODO"
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
