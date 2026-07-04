"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { chatGptImportTemplate } from "@/features/imports/chatgpt-template";
import {
  initialChatGptImportFormState,
  type ChatGptImportFormState,
} from "@/features/imports/validators";

type ChatGptImportFormAction = (
  previousState: ChatGptImportFormState,
  formData: FormData,
) => Promise<ChatGptImportFormState>;

type ChatGptImportFormProps = {
  action: ChatGptImportFormAction;
};

const textareaClassName =
  "min-h-96 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

export function ChatGptImportForm({ action }: ChatGptImportFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialChatGptImportFormState,
  );
  const payloadError = state.errors?.payload?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="payload" className="text-sm font-medium text-foreground">
          Import JSON
        </label>
        <textarea
          id="payload"
          name="payload"
          defaultValue={state.values?.payload ?? ""}
          aria-invalid={Boolean(payloadError)}
          aria-describedby={payloadError ? "payload-error" : undefined}
          className={textareaClassName}
          placeholder={chatGptImportTemplate}
        />
        {payloadError ? (
          <p
            id="payload-error"
            className="whitespace-pre-wrap text-xs text-destructive"
          >
            {payloadError}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Importing..." : "Import"}
        </Button>
      </div>
    </form>
  );
}
