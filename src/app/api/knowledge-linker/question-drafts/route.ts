import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createQuestionDraftsForKnowledgeLinks } from "@/features/knowledge-linker/queries";
import { knowledgeQuestionDraftRequestSchema } from "@/features/knowledge-linker/validators";

function entityPath(entityType: string, entityId: string) {
  return entityType === "resource" ? `/resources/${entityId}` : `/notes/${entityId}`;
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

  const parsed = knowledgeQuestionDraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "入力内容を確認してください",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createQuestionDraftsForKnowledgeLinks(parsed.data);

    revalidatePath(entityPath(parsed.data.entityType, parsed.data.entityId));
    revalidatePath("/questions");
    revalidatePath("/knowledge-map");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Question draft の作成に失敗しました",
      },
      { status: 400 },
    );
  }
}
