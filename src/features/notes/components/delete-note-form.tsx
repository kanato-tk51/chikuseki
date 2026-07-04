"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteNoteAction } from "@/features/notes/actions";

type DeleteNoteFormProps = {
  noteId: string;
  noteTitle: string;
};

export function DeleteNoteForm({ noteId, noteTitle }: DeleteNoteFormProps) {
  return (
    <form
      action={deleteNoteAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${noteTitle}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={noteId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </form>
  );
}
