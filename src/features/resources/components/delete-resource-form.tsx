"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteResourceAction } from "@/features/resources/actions";

type DeleteResourceFormProps = {
  resourceId: string;
  resourceTitle: string;
};

export function DeleteResourceForm({
  resourceId,
  resourceTitle,
}: DeleteResourceFormProps) {
  return (
    <form
      action={deleteResourceAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${resourceTitle}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={resourceId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </form>
  );
}
