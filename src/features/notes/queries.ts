import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { entityLinks, learningNotes, questionCards, resources } from "@/db/schema";
import { noteIdSchema } from "@/features/notes/validators";
import { resourceIdSchema } from "@/features/resources/validators";

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

export async function listNotesByResourceId(resourceId: string) {
  const parsedId = resourceIdSchema.safeParse(resourceId);

  if (!parsedId.success) {
    return [];
  }

  const noteFields = {
    id: learningNotes.id,
    title: learningNotes.title,
    noteType: learningNotes.noteType,
    updatedAt: learningNotes.updatedAt,
    createdAt: learningNotes.createdAt,
  };

  const [primaryNotes, linkedNotes] = await Promise.all([
    getDb()
      .select(noteFields)
      .from(learningNotes)
      .where(eq(learningNotes.resourceId, parsedId.data))
      .orderBy(desc(learningNotes.createdAt))
      .limit(20),
    getDb()
      .select(noteFields)
      .from(entityLinks)
      .innerJoin(learningNotes, eq(entityLinks.fromId, learningNotes.id))
      .where(
        and(
          eq(entityLinks.fromType, "learning_note"),
          eq(entityLinks.toType, "resource"),
          eq(entityLinks.toId, parsedId.data),
          eq(entityLinks.relationType, "references_resource"),
        ),
      )
      .orderBy(desc(learningNotes.createdAt))
      .limit(20),
  ]);

  const notesById = new Map<string, (typeof primaryNotes)[number]>();

  for (const note of [...primaryNotes, ...linkedNotes]) {
    notesById.set(note.id, note);
  }

  return [...notesById.values()]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);
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

export async function listLinkedResourcesByNoteId(noteId: string) {
  const parsedId = noteIdSchema.safeParse(noteId);

  if (!parsedId.success) {
    return [];
  }

  return getDb()
    .select({
      id: resources.id,
      title: resources.title,
      type: resources.type,
      url: resources.url,
    })
    .from(entityLinks)
    .innerJoin(resources, eq(entityLinks.toId, resources.id))
    .where(
      and(
        eq(entityLinks.fromType, "learning_note"),
        eq(entityLinks.fromId, parsedId.data),
        eq(entityLinks.toType, "resource"),
        eq(entityLinks.relationType, "references_resource"),
      ),
    )
    .orderBy(desc(entityLinks.createdAt))
    .limit(20);
}

export async function listQuestionsByNoteId(noteId: string) {
  const parsedId = noteIdSchema.safeParse(noteId);

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
        eq(entityLinks.fromType, "learning_note"),
        eq(entityLinks.fromId, parsedId.data),
        eq(entityLinks.toType, "question_card"),
        eq(entityLinks.relationType, "derived_question"),
      ),
    )
    .orderBy(desc(questionCards.createdAt))
    .limit(50);
}
