import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeleteNoteForm } from "@/features/notes/components/delete-note-form";
import { getNoteById } from "@/features/notes/queries";
import { learningNoteTypeLabels } from "@/features/notes/validators";
import { resourceTypeLabels } from "@/features/resources/validators";

export const dynamic = "force-dynamic";

type NoteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {learningNoteTypeLabels[note.noteType]}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {note.id}
              </span>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-normal">
              {note.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/notes">
                <ArrowLeft aria-hidden="true" />
                Notes
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/notes/${note.id}/edit`}>
                <Edit aria-hidden="true" />
                Edit
              </Link>
            </Button>
            <DeleteNoteForm noteId={note.id} noteTitle={note.title} />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Learning Note として保存されている基本情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Related Resource">
                {note.resourceId && note.resourceTitle ? (
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/resources/${note.resourceId}`}
                      className="inline-flex max-w-full items-center gap-2 underline-offset-4 hover:underline"
                    >
                      <span className="truncate">{note.resourceTitle}</span>
                      {note.resourceType ? (
                        <Badge variant="outline">
                          {resourceTypeLabels[note.resourceType]}
                        </Badge>
                      ) : null}
                    </Link>
                    {note.resourceUrl ? (
                      <a
                        href={note.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <span className="truncate">{note.resourceUrl}</span>
                        <ExternalLink
                          aria-hidden="true"
                          className="size-3 shrink-0"
                        />
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">未設定</span>
                )}
              </DetailRow>
              <Separator />
              <DetailRow label="Created">
                <span className="font-mono text-xs">
                  {formatDateTime(note.createdAt)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="font-mono text-xs">
                  {formatDateTime(note.updatedAt)}
                </span>
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Body</h2>
          {note.bodyMd ? (
            <div className="min-h-80 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-6 text-foreground">
              {note.bodyMd}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              未設定
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
