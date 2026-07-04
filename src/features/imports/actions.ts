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
  type ChatGptImportPayload,
  type ChatGptImportFormState,
  parseChatGptConversationUrl,
  parseChatGptImportPayload,
  readChatGptImportFormData,
} from "@/features/imports/validators";

function validationErrorState(
  values: ReturnType<typeof readChatGptImportFormData>,
  errors: ChatGptImportFormState["errors"],
): ChatGptImportFormState {
  return {
    status: "error",
    message: "入力内容を確認してください",
    errors,
    values,
  };
}

function payloadErrorState(
  values: ReturnType<typeof readChatGptImportFormData>,
  message: string,
): ChatGptImportFormState {
  return validationErrorState(values, {
    payload: [message],
  });
}

function withConversationUrl(
  payload: ChatGptImportPayload,
  conversationUrl: string | null,
): ChatGptImportPayload {
  if (!conversationUrl) {
    return payload;
  }

  const sources = payload.sources.map((source) => ({ ...source }));
  const items = payload.items.map((item) => ({
    ...item,
    sourceKeys: [...item.sourceKeys],
    note: { ...item.note },
    questions: item.questions.map((question) => ({ ...question })),
  }));
  let sourceIndex = sources.findIndex(
    (source) =>
      source.key === "chatgpt-conversation" ||
      source.sourceName?.toLowerCase() === "chatgpt",
  );

  if (sourceIndex === -1 && sources.length > 0) {
    sourceIndex = 0;
  }

  let sourceKey = "chatgpt-conversation";

  if (sourceIndex >= 0) {
    sourceKey = sources[sourceIndex].key;
    sources[sourceIndex] = {
      ...sources[sourceIndex],
      url: conversationUrl,
    };
  } else {
    sources.push({
      key: sourceKey,
      title: "ChatGPT conversation",
      type: "other",
      url: conversationUrl,
      sourceName: "ChatGPT",
      author: null,
      summary: null,
      memo: null,
    });
  }

  for (const item of items) {
    if (!item.sourceKeys.includes(sourceKey)) {
      item.sourceKeys = [sourceKey, ...item.sourceKeys];
    }
  }

  return {
    ...payload,
    sources,
    items,
  };
}

export async function importChatGptKnowledgeAction(
  _previousState: ChatGptImportFormState,
  formData: FormData,
): Promise<ChatGptImportFormState> {
  const values = readChatGptImportFormData(formData);
  const conversationUrl = parseChatGptConversationUrl(values.conversationUrl);

  if (!conversationUrl.success) {
    return validationErrorState(values, {
      conversationUrl: [conversationUrl.error],
    });
  }

  const parsed = parseChatGptImportPayload(values.payload);

  if (!parsed.success) {
    return payloadErrorState(values, parsed.error);
  }

  const payload = withConversationUrl(parsed.data, conversationUrl.data);

  let imported: { noteIds: string[]; resourceIds: string[] };

  try {
    imported = await getDb().transaction(async (tx) => {
      const resourceIdsByKey = new Map<string, string>();
      const resourceIds: string[] = [];
      const noteIds: string[] = [];

      for (const source of payload.sources) {
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

      for (const item of payload.items) {
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
