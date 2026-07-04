import { and, asc, eq, lte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { questionCards, reviewItems } from "@/db/schema";
import { questionIdSchema } from "@/features/questions/validators";

export async function listTodayReviewItems() {
  return getDb()
    .select({
      reviewItemId: reviewItems.id,
      nextReviewAt: reviewItems.nextReviewAt,
      intervalDays: reviewItems.intervalDays,
      ease: reviewItems.ease,
      lastResult: reviewItems.lastResult,
      questionId: questionCards.id,
      questionTitle: questionCards.title,
      questionMd: questionCards.questionMd,
      answerMd: questionCards.answerMd,
      explanationMd: questionCards.explanationMd,
      difficulty: questionCards.difficulty,
    })
    .from(reviewItems)
    .innerJoin(questionCards, eq(reviewItems.targetId, questionCards.id))
    .where(
      and(
        eq(reviewItems.targetType, "question_card"),
        eq(questionCards.status, "active"),
        lte(reviewItems.nextReviewAt, new Date()),
      ),
    )
    .orderBy(asc(reviewItems.nextReviewAt), asc(questionCards.createdAt))
    .limit(50);
}

export async function getQuestionReviewItem(questionId: string) {
  const parsedId = questionIdSchema.safeParse(questionId);

  if (!parsedId.success) {
    return null;
  }

  const [reviewItem] = await getDb()
    .select({
      id: reviewItems.id,
      nextReviewAt: reviewItems.nextReviewAt,
      intervalDays: reviewItems.intervalDays,
      ease: reviewItems.ease,
      lastResult: reviewItems.lastResult,
      updatedAt: reviewItems.updatedAt,
      createdAt: reviewItems.createdAt,
    })
    .from(reviewItems)
    .where(
      and(
        eq(reviewItems.targetType, "question_card"),
        eq(reviewItems.targetId, parsedId.data),
      ),
    )
    .limit(1);

  return reviewItem ?? null;
}
