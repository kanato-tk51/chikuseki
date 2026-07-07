"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  entityLinks,
  knowledgeEntityLinks,
  questionCards,
  reviewItems,
} from "@/db/schema";
import {
  type QuestionFormState,
  questionFormSchema,
  questionIdSchema,
  readQuestionFormData,
} from "@/features/questions/validators";

function validationErrorState(
  values: ReturnType<typeof readQuestionFormData>,
  errors: QuestionFormState["errors"],
): QuestionFormState {
  return {
    status: "error",
    message: "入力内容を確認してください",
    errors,
    values,
  };
}

export async function createQuestionAction(
  _previousState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const values = readQuestionFormData(formData);
  const parsed = questionFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    await getDb().insert(questionCards).values(parsed.data);
  } catch {
    return {
      status: "error",
      message: "Question の作成に失敗しました",
      values,
    };
  }

  revalidatePath("/questions");
  redirect("/questions");
}

export async function updateQuestionAction(
  id: string,
  _previousState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const parsedId = questionIdSchema.safeParse(id);
  const values = readQuestionFormData(formData);

  if (!parsedId.success) {
    return {
      status: "error",
      message: "Question ID が不正です",
      values,
    };
  }

  const parsed = questionFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    const [updatedQuestion] = await getDb()
      .update(questionCards)
      .set(parsed.data)
      .where(eq(questionCards.id, parsedId.data))
      .returning({ id: questionCards.id });

    if (!updatedQuestion) {
      return {
        status: "error",
        message: "Question が見つかりません",
        values,
      };
    }
  } catch {
    return {
      status: "error",
      message: "Question の更新に失敗しました",
      values,
    };
  }

  revalidatePath("/questions");
  revalidatePath(`/questions/${parsedId.data}`);
  redirect(`/questions/${parsedId.data}`);
}

export async function deleteQuestionAction(formData: FormData) {
  const id = formData.get("id");
  const parsedId = questionIdSchema.safeParse(id);

  if (!parsedId.success) {
    redirect("/questions");
  }

  await getDb().transaction(async (tx) => {
    await tx
      .delete(entityLinks)
      .where(
        or(
          and(
            eq(entityLinks.fromType, "question_card"),
            eq(entityLinks.fromId, parsedId.data),
          ),
          and(
            eq(entityLinks.toType, "question_card"),
            eq(entityLinks.toId, parsedId.data),
          ),
        ),
      );

    await tx
      .delete(knowledgeEntityLinks)
      .where(
        and(
          eq(knowledgeEntityLinks.entityType, "question_card"),
          eq(knowledgeEntityLinks.entityId, parsedId.data),
        ),
      );

    await tx
      .delete(reviewItems)
      .where(
        and(
          eq(reviewItems.targetType, "question_card"),
          eq(reviewItems.targetId, parsedId.data),
        ),
      );

    await tx
      .delete(questionCards)
      .where(eq(questionCards.id, parsedId.data));
  });

  revalidatePath("/questions");
  revalidatePath("/reviews/today");
  revalidatePath("/knowledge-map");
  redirect("/questions");
}
