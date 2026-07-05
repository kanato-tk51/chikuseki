"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { knowledgeNodeProgress } from "@/db/schema";
import {
  knowledgeProgressFormSchema,
  readKnowledgeProgressFormData,
} from "@/features/knowledge-map/validators";

export async function updateKnowledgeNodeProgressAction(formData: FormData) {
  const parsed = knowledgeProgressFormSchema.safeParse(
    readKnowledgeProgressFormData(formData),
  );

  if (!parsed.success) {
    redirect("/knowledge-map");
  }

  const now = new Date();

  await getDb()
    .insert(knowledgeNodeProgress)
    .values({
      nodeId: parsed.data.nodeId,
      status: parsed.data.status,
      interestLevel: parsed.data.interestLevel,
      memo: parsed.data.memo,
      lastReviewedAt: now,
    })
    .onConflictDoUpdate({
      target: knowledgeNodeProgress.nodeId,
      set: {
        status: parsed.data.status,
        interestLevel: parsed.data.interestLevel,
        memo: parsed.data.memo,
        lastReviewedAt: now,
        updatedAt: now,
      },
    });

  revalidatePath("/knowledge-map");
  revalidatePath(parsed.data.returnTo.split("?")[0] ?? "/knowledge-map");
  redirect(parsed.data.returnTo);
}
