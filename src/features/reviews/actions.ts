"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { questionCards, reviewItems, reviewLogs } from "@/db/schema";
import { questionIdSchema } from "@/features/questions/validators";
import {
  readReviewSubmissionFormData,
  type ReviewResult,
  reviewSubmissionSchema,
} from "@/features/reviews/validators";

type ReviewScheduleInput = {
  ease: number;
  intervalDays: number;
  result: ReviewResult;
};

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function calculateNextSchedule({
  ease,
  intervalDays,
  result,
}: ReviewScheduleInput) {
  const currentEase = Number.isFinite(ease) ? ease : 2.5;
  const currentInterval = Math.max(intervalDays, 0);

  if (result === "again") {
    return {
      ease: Math.max(1.3, currentEase - 0.2),
      intervalDays: 1,
    };
  }

  if (result === "hard") {
    return {
      ease: Math.max(1.3, currentEase - 0.1),
      intervalDays: Math.max(1, Math.ceil(currentInterval * 1.2)),
    };
  }

  if (result === "easy") {
    return {
      ease: currentEase + 0.15,
      intervalDays:
        currentInterval === 0
          ? 4
          : Math.max(1, Math.ceil(currentInterval * currentEase * 1.3)),
    };
  }

  return {
    ease: currentEase,
    intervalDays:
      currentInterval === 0
        ? 2
        : Math.max(1, Math.ceil(currentInterval * currentEase)),
  };
}

export async function addQuestionToReviewQueueAction(formData: FormData) {
  const questionId = formData.get("questionId");
  const parsedId = questionIdSchema.safeParse(questionId);

  if (!parsedId.success) {
    redirect("/questions");
  }

  const now = new Date();
  const queuedQuestion = await getDb().transaction(async (tx) => {
    const [question] = await tx
      .select({ id: questionCards.id })
      .from(questionCards)
      .where(eq(questionCards.id, parsedId.data))
      .limit(1);

    if (!question) {
      return null;
    }

    await tx
      .update(questionCards)
      .set({ status: "active" })
      .where(eq(questionCards.id, question.id));

    const [existingReviewItem] = await tx
      .select({ id: reviewItems.id })
      .from(reviewItems)
      .where(
        and(
          eq(reviewItems.targetType, "question_card"),
          eq(reviewItems.targetId, question.id),
        ),
      )
      .limit(1);

    if (existingReviewItem) {
      await tx
        .update(reviewItems)
        .set({ nextReviewAt: now })
        .where(eq(reviewItems.id, existingReviewItem.id));
    } else {
      await tx.insert(reviewItems).values({
        targetType: "question_card",
        targetId: question.id,
        nextReviewAt: now,
      });
    }

    return question;
  });

  if (!queuedQuestion) {
    redirect("/questions");
  }

  revalidatePath("/questions");
  revalidatePath(`/questions/${queuedQuestion.id}`);
  revalidatePath("/reviews/today");
  redirect(`/questions/${queuedQuestion.id}`);
}

export async function submitReviewResultAction(formData: FormData) {
  const values = readReviewSubmissionFormData(formData);
  const parsed = reviewSubmissionSchema.safeParse(values);

  if (!parsed.success) {
    redirect("/reviews/today");
  }

  const reviewedAt = new Date();
  const reviewedItem = await getDb().transaction(async (tx) => {
    const [reviewItem] = await tx
      .select({
        id: reviewItems.id,
        targetId: reviewItems.targetId,
        ease: reviewItems.ease,
        intervalDays: reviewItems.intervalDays,
      })
      .from(reviewItems)
      .where(eq(reviewItems.id, parsed.data.reviewItemId))
      .limit(1);

    if (!reviewItem) {
      return null;
    }

    const nextSchedule = calculateNextSchedule({
      ease: reviewItem.ease,
      intervalDays: reviewItem.intervalDays,
      result: parsed.data.result,
    });

    await tx.insert(reviewLogs).values({
      reviewItemId: reviewItem.id,
      result: parsed.data.result,
      reviewedAt,
    });

    await tx
      .update(reviewItems)
      .set({
        ...nextSchedule,
        lastResult: parsed.data.result,
        nextReviewAt: addDays(reviewedAt, nextSchedule.intervalDays),
      })
      .where(eq(reviewItems.id, reviewItem.id));

    return reviewItem;
  });

  if (reviewedItem) {
    revalidatePath(`/questions/${reviewedItem.targetId}`);
  }

  revalidatePath("/reviews/today");
  redirect("/reviews/today");
}
