import { NextResponse } from "next/server";

import { suggestKnowledgeLinks } from "@/features/knowledge-linker/queries";
import { knowledgeLinkerRequestSchema } from "@/features/knowledge-linker/validators";

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

  const parsed = knowledgeLinkerRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "入力内容を確認してください",
      },
      { status: 400 },
    );
  }

  const candidates = await suggestKnowledgeLinks(parsed.data);

  return NextResponse.json({ candidates });
}
