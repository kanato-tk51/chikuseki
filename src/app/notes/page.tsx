import Link from "next/link";
import { ArrowLeft, NotebookText, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listNotes } from "@/features/notes/queries";
import { learningNoteTypeLabels } from "@/features/notes/validators";

export const dynamic = "force-dynamic";

type NotesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const notes = await listNotes({ q });
  const hasSearch = q.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">Notes</h1>
              <Badge variant="secondary">CRUD</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Resource から学んだことを残す場所
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Home
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/notes/new">
                <Plus aria-hidden="true" />
                New Note
              </Link>
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <form
            action="/notes"
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Search notes</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search title or body"
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 sm:flex-none">
                <Search aria-hidden="true" />
                Search
              </Button>
              {hasSearch ? (
                <Button asChild variant="outline" className="flex-1 sm:flex-none">
                  <Link href="/notes">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>

          {notes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Note list</CardTitle>
                <CardDescription>
                  {hasSearch
                    ? `${notes.length}件の検索結果`
                    : `${notes.length}件の Note`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[minmax(240px,1fr)_120px_minmax(220px,1fr)_150px_150px] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
                      <div>Title</div>
                      <div>Type</div>
                      <div>Resource</div>
                      <div>Updated</div>
                      <div>Created</div>
                    </div>
                    <div className="divide-y divide-border">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="grid grid-cols-[minmax(240px,1fr)_120px_minmax(220px,1fr)_150px_150px] items-center gap-3 px-3 py-3 text-sm"
                        >
                          <Link
                            href={`/notes/${note.id}`}
                            className="min-w-0 font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            <span className="block truncate">
                              {note.title}
                            </span>
                          </Link>
                          <div>
                            <Badge variant="outline">
                              {learningNoteTypeLabels[note.noteType]}
                            </Badge>
                          </div>
                          <div className="min-w-0">
                            {note.resourceId && note.resourceTitle ? (
                              <Link
                                href={`/resources/${note.resourceId}`}
                                className="block truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                              >
                                {note.resourceTitle}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">
                                未設定
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {formatDateTime(note.updatedAt)}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {formatDateTime(note.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <NotebookText aria-hidden="true" className="size-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-medium">
                    {hasSearch ? "検索結果がありません" : "Note はまだありません"}
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {hasSearch
                      ? "検索語を変えるか、一覧に戻って確認してください。"
                      : "Resource から学んだことをまず1件保存します。"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {hasSearch ? (
                    <Button asChild variant="outline">
                      <Link href="/notes">Clear search</Link>
                    </Button>
                  ) : null}
                  <Button asChild>
                    <Link href="/notes/new">
                      <Plus aria-hidden="true" />
                      New Note
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
