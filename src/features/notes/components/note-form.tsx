"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  emptyNoteFormData,
  initialNoteFormState,
  learningNoteTypeLabels,
  learningNoteTypes,
  type NoteFormData,
  type NoteFormField,
  type NoteFormState,
} from "@/features/notes/validators";
import {
  resourceTypeLabels,
  type ResourceType,
} from "@/features/resources/validators";

type NoteFormAction = (
  previousState: NoteFormState,
  formData: FormData,
) => Promise<NoteFormState>;

type ResourceOption = {
  id: string;
  title: string;
  type: ResourceType;
  url: string | null;
};

type NoteFormProps = {
  action: NoteFormAction;
  cancelHref: string;
  resourceOptions: ResourceOption[];
  submitLabel: string;
  initialValues?: NoteFormData;
};

const inputClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const textareaClassName =
  "min-h-80 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function FieldError({
  errors,
  id,
}: {
  errors?: NoteFormState["errors"];
  id: NoteFormField;
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
  id: NoteFormField;
  label: string;
  children: React.ReactNode;
  errors?: NoteFormState["errors"];
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

function resourceLabel(resource: ResourceOption) {
  let urlLabel = "";

  if (resource.url) {
    try {
      urlLabel = ` - ${new URL(resource.url).hostname}`;
    } catch {
      urlLabel = "";
    }
  }

  return `${resource.title} (${resourceTypeLabels[resource.type]})${urlLabel}`;
}

export function NoteForm({
  action,
  cancelHref,
  resourceOptions,
  submitLabel,
  initialValues = emptyNoteFormData,
}: NoteFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialNoteFormState,
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
            placeholder="例: RSC のキャッシュ境界で学んだこと"
          />
        </Field>

        <Field id="noteType" label="Type" errors={errors}>
          <select
            id="noteType"
            name="noteType"
            defaultValue={values.noteType}
            aria-invalid={Boolean(errors?.noteType)}
            aria-describedby={errors?.noteType ? "noteType-error" : undefined}
            className={inputClassName}
          >
            {learningNoteTypes.map((type) => (
              <option key={type} value={type}>
                {learningNoteTypeLabels[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="resourceId" label="Related Resource" errors={errors}>
        <select
          id="resourceId"
          name="resourceId"
          defaultValue={values.resourceId}
          aria-invalid={Boolean(errors?.resourceId)}
          aria-describedby={errors?.resourceId ? "resourceId-error" : undefined}
          className={inputClassName}
        >
          <option value="">No resource</option>
          {resourceOptions.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resourceLabel(resource)}
            </option>
          ))}
        </select>
      </Field>

      <Field id="bodyMd" label="Body" errors={errors}>
        <textarea
          id="bodyMd"
          name="bodyMd"
          defaultValue={values.bodyMd}
          aria-invalid={Boolean(errors?.bodyMd)}
          aria-describedby={errors?.bodyMd ? "bodyMd-error" : undefined}
          className={textareaClassName}
          placeholder="学んだこと、気づき、あとで問題化したい内容"
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
