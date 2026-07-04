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

  let imported: { noteIds: string[]; resourceIds: string[] };

  try {
    imported = await getDb().transaction(async (tx) => {
      const resourceIdsByKey = new Map<string, string>();
      const resourceIds: string[] = [];
      const noteIds: string[] = [];

      for (const source of parsed.data.sources) {
        const [resource] = await tx
          .insert(resources)
          .values({
            title: source.title,
            type: source.type,
            url: source.url,
            sourceName: source.sourceName,
            author: source.author,
            summary: source.summary,
            memo: source.memo,
            consumedAt: new Date(),
          })
          .returning({ id: resources.id });

        resourceIdsByKey.set(source.key, resource.id);
        resourceIds.push(resource.id);
      }

      for (const item of parsed.data.items) {
        const itemResourceIds = item.sourceKeys
          .map((sourceKey) => resourceIdsByKey.get(sourceKey))
          .filter((resourceId): resourceId is string => Boolean(resourceId));
        const primaryResourceId = itemResourceIds[0] ?? null;

        const [note] = await tx
          .insert(learningNotes)
          .values({
            title: item.note.title,
            noteType: item.note.noteType,
            bodyMd: item.note.bodyMd,
            resourceId: primaryResourceId,
          })
          .returning({ id: learningNotes.id });

        noteIds.push(note.id);

        if (itemResourceIds.length > 0) {
          await tx.insert(entityLinks).values(
            itemResourceIds.map((resourceId) => ({
              fromType: "learning_note" as const,
              fromId: note.id,
              toType: "resource" as const,
              toId: resourceId,
              relationType: "references_resource",
            })),
          );
        }

        if (item.questions.length > 0) {
          const questions = await tx
            .insert(questionCards)
            .values(item.questions)
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
      }

      return {
        noteIds,
        resourceIds,
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
  revalidatePath("/questions");

  for (const noteId of imported.noteIds) {
    revalidatePath(`/notes/${noteId}`);
  }

  for (const resourceId of imported.resourceIds) {
    revalidatePath(`/resources/${resourceId}`);
  }

  if (imported.noteIds.length === 1) {
    redirect(`/notes/${imported.noteIds[0]}`);
  }

  redirect("/notes");
}
