import { desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { resources } from "@/db/schema";
import { resourceIdSchema } from "@/features/resources/validators";

export async function listResources({ q }: { q?: string } = {}) {
  const query = q?.trim();
  const searchPattern = query ? `%${query}%` : undefined;

  return getDb()
    .select({
      id: resources.id,
      type: resources.type,
      title: resources.title,
      url: resources.url,
      consumedAt: resources.consumedAt,
      createdAt: resources.createdAt,
    })
    .from(resources)
    .where(
      searchPattern
        ? or(
            ilike(resources.title, searchPattern),
            ilike(resources.url, searchPattern),
            ilike(resources.summary, searchPattern),
            ilike(resources.memo, searchPattern),
          )
        : undefined,
    )
    .orderBy(desc(resources.createdAt))
    .limit(100);
}

export async function getResourceById(id: string) {
  const parsedId = resourceIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const [resource] = await getDb()
    .select()
    .from(resources)
    .where(eq(resources.id, parsedId.data))
    .limit(1);

  return resource ?? null;
}
