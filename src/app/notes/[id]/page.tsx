import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink, HelpCircle } from "lucide-react";

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
import {
  getNoteById,
  listLinkedResourcesByNoteId,
  listQuestionsByNoteId,
} from "@/features/notes/queries";
import { learningNoteTypeLabels } from "@/features/notes/validators";
import {
  difficultyLabels,
  questionStatusLabels,
} from "@/features/questions/validators";
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
  const [note, linkedResources, linkedQuestions] = await Promise.all([
    getNoteById(id),
    listLinkedResourcesByNoteId(id),
    listQuestionsByNoteId(id),
  ]);

  if (!note) {
    notFound();
  }

  const primaryResource =
    note.resourceId && note.resourceTitle && note.resourceType
      ? {
          id: note.resourceId,
          title: note.resourceTitle,
          type: note.resourceType,
          url: note.resourceUrl,
        }
      : null;
  const relatedResources =
    linkedResources.length > 0
      ? linkedResources
      : primaryResource
        ? [primaryResource]
        : [];

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
              <DetailRow label="Related Resources">
                {relatedResources.length > 0 ? (
                  <div className="space-y-3">
                    {relatedResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex min-w-0 flex-col gap-1"
                      >
                        <Link
                          href={`/resources/${resource.id}`}
                          className="inline-flex max-w-full items-center gap-2 underline-offset-4 hover:underline"
                        >
                          <span className="truncate">{resource.title}</span>
                          <Badge variant="outline">
                            {resourceTypeLabels[resource.type]}
                          </Badge>
                        </Link>
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            <span className="truncate">{resource.url}</span>
                            <ExternalLink
                              aria-hidden="true"
                              className="size-3 shrink-0"
                            />
                          </a>
                        ) : null}
                      </div>
                    ))}
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

        <Card>
          <CardHeader>
            <CardTitle>Derived Questions</CardTitle>
            <CardDescription>
              この Learning Note から作成された Question
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedQuestions.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(260px,1fr)_120px_120px_150px] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
                    <div>Title</div>
                    <div>Difficulty</div>
                    <div>Status</div>
                    <div>Created</div>
                  </div>
                  <div className="divide-y divide-border">
                    {linkedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="grid grid-cols-[minmax(260px,1fr)_120px_120px_150px] items-center gap-3 px-3 py-3 text-sm"
                      >
                        <Link
                          href={`/questions/${question.id}`}
                          className="min-w-0 font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          <span className="block truncate">
                            {question.title}
                          </span>
                        </Link>
                        <div>
                          <Badge variant="outline">
                            {difficultyLabels[question.difficulty]}
                          </Badge>
                        </div>
                        <div>
                          <Badge variant="secondary">
                            {questionStatusLabels[question.status]}
                          </Badge>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(question.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <HelpCircle aria-hidden="true" className="size-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-medium">
                    Question はまだありません
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    この Note から作成された復習問題がここに表示されます。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
