import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveKnowledgeEntityLinks } from "@/features/knowledge-linker/queries";
import { knowledgeLinkSaveRequestSchema } from "@/features/knowledge-linker/validators";

function entityPath(entityType: string, entityId: string) {
  if (entityType === "resource") {
    return `/resources/${entityId}`;
  }

  if (entityType === "learning_note") {
    return `/notes/${entityId}`;
  }

  if (entityType === "question_card") {
    return `/questions/${entityId}`;
  }

  return "/";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON を読み取れませんでした" },
      { status: 400 },
    );
  }

  const parsed = knowledgeLinkSaveRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "入力内容を確認してください",
      },
      { status: 400 },
    );
  }

  try {
    const result = await saveKnowledgeEntityLinks(parsed.data);

    revalidatePath(entityPath(parsed.data.entityType, parsed.data.entityId));
    revalidatePath("/knowledge-map");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Knowledge Node の保存に失敗しました",
      },
      { status: 400 },
    );
  }
}
