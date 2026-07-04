"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import {
  entityLinks,
  learningNotes,
  questionCards,
  resources,
} from "@/db/schema";
import {
  type ChatGptImportFormState,
  parseChatGptImportPayload,
  readChatGptImportFormData,
} from "@/features/imports/validators";

function payloadErrorState(
  values: ReturnType<typeof readChatGptImportFormData>,
  message: string,
): ChatGptImportFormState {
  return {
    status: "error",
    message: "入力内容を確認してください",
    errors: {
      payload: [message],
    },
    values,
  };
}

export async function importChatGptKnowledgeAction(
  _previousState: ChatGptImportFormState,
  formData: FormData,
): Promise<ChatGptImportFormState> {
  const values = readChatGptImportFormData(formData);
  const parsed = parseChatGptImportPayload(values.payload);

  if (!parsed.success) {
    return payloadErrorState(values, parsed.error);
  }

  let imported: { noteId: string };

  try {
    imported = await getDb().transaction(async (tx) => {
      let resourceId: string | null = null;

      if (parsed.data.source) {
        const [resource] = await tx
          .insert(resources)
          .values({
            title: parsed.data.source.title,
            type: parsed.data.source.type,
            url: parsed.data.source.url,
            sourceName: parsed.data.source.sourceName,
            author: parsed.data.source.author,
            summary: parsed.data.source.summary,
            memo: parsed.data.source.memo,
            consumedAt: new Date(),
          })
          .returning({ id: resources.id });

        resourceId = resource.id;
      }

      const [note] = await tx
        .insert(learningNotes)
        .values({
          title: parsed.data.note.title,
          noteType: parsed.data.note.noteType,
          bodyMd: parsed.data.note.bodyMd,
          resourceId,
        })
        .returning({ id: learningNotes.id });

      if (parsed.data.questions.length > 0) {
        const questions = await tx
          .insert(questionCards)
          .values(parsed.data.questions)
          .returning({ id: questionCards.id });

        await tx.insert(entityLinks).values(
          questions.map((question) => ({
            fromType: "learning_note" as const,
            fromId: note.id,
            toType: "question_card" as const,
            toId: question.id,
            relationType: "derived_question",
          })),
        );
      }

      return {
        noteId: note.id,
      };
    });

  } catch {
    return {
      status: "error",
      message: "ChatGPT 出力の import に失敗しました",
      values,
    };
  }

  revalidatePath("/resources");
  revalidatePath("/notes");
  revalidatePath(`/notes/${imported.noteId}`);
  revalidatePath("/questions");
  redirect(`/notes/${imported.noteId}`);
}
