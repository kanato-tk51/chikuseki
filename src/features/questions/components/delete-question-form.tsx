"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/features/questions/actions";

type DeleteQuestionFormProps = {
  questionId: string;
  questionTitle: string;
};

export function DeleteQuestionForm({
  questionId,
  questionTitle,
}: DeleteQuestionFormProps) {
  return (
    <form
      action={deleteQuestionAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${questionTitle}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={questionId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </form>
  );
}
