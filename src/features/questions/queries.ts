import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { entityLinks, questionCards } from "@/db/schema";
import { questionIdSchema } from "@/features/questions/validators";
import { resourceIdSchema } from "@/features/resources/validators";

export async function listQuestions({ q }: { q?: string } = {}) {
  const query = q?.trim();
  const searchPattern = query ? `%${query}%` : undefined;

  return getDb()
    .select({
      id: questionCards.id,
      title: questionCards.title,
      difficulty: questionCards.difficulty,
      status: questionCards.status,
      updatedAt: questionCards.updatedAt,
      createdAt: questionCards.createdAt,
    })
    .from(questionCards)
    .where(
      searchPattern
        ? or(
            ilike(questionCards.title, searchPattern),
            ilike(questionCards.questionMd, searchPattern),
            ilike(questionCards.answerMd, searchPattern),
            ilike(questionCards.explanationMd, searchPattern),
          )
        : undefined,
    )
    .orderBy(desc(questionCards.createdAt))
    .limit(100);
}

export async function getQuestionById(id: string) {
  const parsedId = questionIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const [question] = await getDb()
    .select()
    .from(questionCards)
    .where(eq(questionCards.id, parsedId.data))
    .limit(1);

  return question ?? null;
}

export async function listQuestionsByResourceId(resourceId: string) {
  const parsedId = resourceIdSchema.safeParse(resourceId);

  if (!parsedId.success) {
    return [];
  }

  return getDb()
    .select({
      id: questionCards.id,
      title: questionCards.title,
      difficulty: questionCards.difficulty,
      status: questionCards.status,
      createdAt: questionCards.createdAt,
    })
    .from(entityLinks)
    .innerJoin(questionCards, eq(entityLinks.toId, questionCards.id))
    .where(
      and(
        eq(entityLinks.fromType, "resource"),
        eq(entityLinks.fromId, parsedId.data),
        eq(entityLinks.toType, "question_card"),
        eq(entityLinks.relationType, "derived_question"),
      ),
    )
    .orderBy(desc(questionCards.createdAt))
    .limit(50);
}
