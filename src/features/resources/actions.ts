"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { entityLinks, knowledgeEntityLinks, resources } from "@/db/schema";
import {
  type ResourceFormState,
  readResourceFormData,
  resourceFormSchema,
  resourceIdSchema,
} from "@/features/resources/validators";

function validationErrorState(
  values: ReturnType<typeof readResourceFormData>,
  errors: ResourceFormState["errors"],
): ResourceFormState {
  return {
    status: "error",
    message: "入力内容を確認してください",
    errors,
    values,
  };
}

export async function createResourceAction(
  _previousState: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const values = readResourceFormData(formData);
  const parsed = resourceFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    await getDb().insert(resources).values(parsed.data);
  } catch {
    return {
      status: "error",
      message: "Resource の作成に失敗しました",
      values,
    };
  }

  revalidatePath("/resources");
  redirect("/resources");
}

export async function updateResourceAction(
  id: string,
  _previousState: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const parsedId = resourceIdSchema.safeParse(id);
  const values = readResourceFormData(formData);

  if (!parsedId.success) {
    return {
      status: "error",
      message: "Resource ID が不正です",
      values,
    };
  }

  const parsed = resourceFormSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    const [updatedResource] = await getDb()
      .update(resources)
      .set(parsed.data)
      .where(eq(resources.id, parsedId.data))
      .returning({ id: resources.id });

    if (!updatedResource) {
      return {
        status: "error",
        message: "Resource が見つかりません",
        values,
      };
    }
  } catch {
    return {
      status: "error",
      message: "Resource の更新に失敗しました",
      values,
    };
  }

  revalidatePath("/resources");
  revalidatePath(`/resources/${parsedId.data}`);
  redirect(`/resources/${parsedId.data}`);
}

export async function deleteResourceAction(formData: FormData) {
  const id = formData.get("id");
  const parsedId = resourceIdSchema.safeParse(id);

  if (!parsedId.success) {
    redirect("/resources");
  }

  await getDb().transaction(async (tx) => {
    await tx
      .delete(entityLinks)
      .where(
        or(
          and(
            eq(entityLinks.fromType, "resource"),
            eq(entityLinks.fromId, parsedId.data),
          ),
          and(
            eq(entityLinks.toType, "resource"),
            eq(entityLinks.toId, parsedId.data),
          ),
        ),
      );

    await tx
      .delete(knowledgeEntityLinks)
      .where(
        and(
          eq(knowledgeEntityLinks.entityType, "resource"),
          eq(knowledgeEntityLinks.entityId, parsedId.data),
        ),
      );

    await tx.delete(resources).where(eq(resources.id, parsedId.data));
  });

  revalidatePath("/resources");
  revalidatePath("/knowledge-map");
  redirect("/resources");
}
