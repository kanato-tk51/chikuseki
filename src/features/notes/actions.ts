"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { entityLinks, knowledgeEntityLinks, learningNotes } from "@/db/schema";
import {
  type NoteFormState,
  noteFormSchema,
  noteIdSchema,
  readNoteFormData,
} from "@/features/notes/validators";

function validationErrorState(
  values: ReturnType<typeof readNoteFormData>,
  errors: NoteFormState["errors"],
): NoteFormState {
  return {
    status: "error",
    message: "入力内容を確認してください",
    errors,
    values,
  };
}

export async function createNoteAction(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const values = readNoteFormData(formData);
  const parsed = noteFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    await getDb().insert(learningNotes).values(parsed.data);
  } catch {
    return {
      status: "error",
      message: "Learning Note の作成に失敗しました",
      values,
    };
  }

  revalidatePath("/notes");
  redirect("/notes");
}

export async function updateNoteAction(
  id: string,
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const parsedId = noteIdSchema.safeParse(id);
  const values = readNoteFormData(formData);

  if (!parsedId.success) {
    return {
      status: "error",
      message: "Learning Note ID が不正です",
      values,
    };
  }

  const parsed = noteFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    const [updatedNote] = await getDb()
      .update(learningNotes)
      .set(parsed.data)
      .where(eq(learningNotes.id, parsedId.data))
      .returning({ id: learningNotes.id });

    if (!updatedNote) {
      return {
        status: "error",
        message: "Learning Note が見つかりません",
        values,
      };
    }
  } catch {
    return {
      status: "error",
      message: "Learning Note の更新に失敗しました",
      values,
    };
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${parsedId.data}`);
  redirect(`/notes/${parsedId.data}`);
}

export async function deleteNoteAction(formData: FormData) {
  const id = formData.get("id");
  const parsedId = noteIdSchema.safeParse(id);

  if (!parsedId.success) {
    redirect("/notes");
  }

  await getDb().transaction(async (tx) => {
    await tx
      .delete(entityLinks)
      .where(
        or(
          and(
            eq(entityLinks.fromType, "learning_note"),
            eq(entityLinks.fromId, parsedId.data),
          ),
          and(
            eq(entityLinks.toType, "learning_note"),
            eq(entityLinks.toId, parsedId.data),
          ),
        ),
      );

    await tx
      .delete(knowledgeEntityLinks)
      .where(
        and(
          eq(knowledgeEntityLinks.entityType, "learning_note"),
          eq(knowledgeEntityLinks.entityId, parsedId.data),
        ),
      );

    await tx
      .delete(learningNotes)
      .where(eq(learningNotes.id, parsedId.data));
  });

  revalidatePath("/notes");
  revalidatePath("/questions");
  revalidatePath("/knowledge-map");
  redirect("/notes");
}
