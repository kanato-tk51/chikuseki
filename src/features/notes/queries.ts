import { desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { learningNotes, resources } from "@/db/schema";
import { noteIdSchema } from "@/features/notes/validators";

export async function listNotes({ q }: { q?: string } = {}) {
  const query = q?.trim();
  const searchPattern = query ? `%${query}%` : undefined;

  return getDb()
    .select({
      id: learningNotes.id,
      title: learningNotes.title,
      noteType: learningNotes.noteType,
      resourceId: learningNotes.resourceId,
      resourceTitle: resources.title,
      updatedAt: learningNotes.updatedAt,
      createdAt: learningNotes.createdAt,
    })
    .from(learningNotes)
    .leftJoin(resources, eq(learningNotes.resourceId, resources.id))
    .where(
      searchPattern
        ? or(
            ilike(learningNotes.title, searchPattern),
            ilike(learningNotes.bodyMd, searchPattern),
          )
        : undefined,
    )
    .orderBy(desc(learningNotes.createdAt))
    .limit(100);
}

export async function getNoteById(id: string) {
  const parsedId = noteIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const [note] = await getDb()
    .select({
      id: learningNotes.id,
      title: learningNotes.title,
      bodyMd: learningNotes.bodyMd,
      noteType: learningNotes.noteType,
      resourceId: learningNotes.resourceId,
      createdAt: learningNotes.createdAt,
      updatedAt: learningNotes.updatedAt,
      resourceTitle: resources.title,
      resourceUrl: resources.url,
      resourceType: resources.type,
    })
    .from(learningNotes)
    .leftJoin(resources, eq(learningNotes.resourceId, resources.id))
    .where(eq(learningNotes.id, parsedId.data))
    .limit(1);

  return note ?? null;
}

export async function listResourceOptions() {
  return getDb()
    .select({
      id: resources.id,
      title: resources.title,
      type: resources.type,
      url: resources.url,
    })
    .from(resources)
    .orderBy(desc(resources.createdAt))
    .limit(100);
}
