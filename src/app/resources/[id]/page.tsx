import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  HelpCircle,
  NotebookText,
  Plus,
} from "lucide-react";

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
import { listKnowledgeDomains } from "@/features/knowledge-map/queries";
import { KnowledgeLinkerForm } from "@/features/knowledge-linker/components/knowledge-linker-form";
import { listKnowledgeLinksForEntity } from "@/features/knowledge-linker/queries";
import { listNotesByResourceId } from "@/features/notes/queries";
import { learningNoteTypeLabels } from "@/features/notes/validators";
import { listQuestionsByResourceId } from "@/features/questions/queries";
import {
  difficultyLabels,
  questionStatusLabels,
} from "@/features/questions/validators";
import { DeleteResourceForm } from "@/features/resources/components/delete-resource-form";
import { getResourceById } from "@/features/resources/queries";
import { resourceTypeLabels } from "@/features/resources/validators";

export const dynamic = "force-dynamic";

type ResourceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
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

function TextBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {value ? (
        <div className="min-h-24 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6 text-foreground">
          {value}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          未設定
        </div>
      )}
    </section>
  );
}

function resourceKnowledgeText(resource: NonNullable<Awaited<ReturnType<typeof getResourceById>>>) {
  return [
    resource.title,
    resource.sourceName,
    resource.author,
    resource.url,
    resource.summary,
    resource.memo,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n\n");
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const { id } = await params;
  const [resource, notes, questions, domains, linkedKnowledgeNodes] = await Promise.all([
    getResourceById(id),
    listNotesByResourceId(id),
    listQuestionsByResourceId(id),
    listKnowledgeDomains(),
    listKnowledgeLinksForEntity({
      entityType: "resource",
      entityId: id,
    }),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{resourceTypeLabels[resource.type]}</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {resource.id}
              </span>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-normal">
              {resource.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/resources">
                <ArrowLeft aria-hidden="true" />
                Resources
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/notes/new?resourceId=${resource.id}`}>
                <Plus aria-hidden="true" />
                New Note
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resources/${resource.id}/edit`}>
                <Edit aria-hidden="true" />
                Edit
              </Link>
            </Button>
            <DeleteResourceForm
              resourceId={resource.id}
              resourceTitle={resource.title}
            />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Resource として保存されている基本情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="URL">
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    <span className="truncate">{resource.url}</span>
                    <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">未設定</span>
                )}
              </DetailRow>
              <DetailRow label="Source">
                {resource.sourceName || (
                  <span className="text-muted-foreground">未設定</span>
                )}
              </DetailRow>
              <DetailRow label="Author">
                {resource.author || (
                  <span className="text-muted-foreground">未設定</span>
                )}
              </DetailRow>
              <DetailRow label="Published">
                <span className="font-mono text-xs">
                  {formatDate(resource.publishedAt)}
                </span>
              </DetailRow>
              <DetailRow label="Consumed">
                <span className="font-mono text-xs">
                  {formatDate(resource.consumedAt)}
                </span>
              </DetailRow>
              <Separator />
              <DetailRow label="Created">
                <span className="font-mono text-xs">
                  {formatDateTime(resource.createdAt)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="font-mono text-xs">
                  {formatDateTime(resource.updatedAt)}
                </span>
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlock title="Summary" value={resource.summary} />
          <TextBlock title="Memo" value={resource.memo} />
        </div>

        <Card id="knowledge-links">
          <CardHeader>
            <CardTitle>Knowledge Links</CardTitle>
            <CardDescription>
              この Resource を Knowledge Map のノードに接続する
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeLinkerForm
              domains={domains}
              initialText={resourceKnowledgeText(resource)}
              targetEntity={{
                entityType: "resource",
                entityId: resource.id,
                label: resource.title,
              }}
              linkedNodes={linkedKnowledgeNodes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Related Notes</CardTitle>
              <CardDescription>
                この Resource から残した Learning Note
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={`/notes/new?resourceId=${resource.id}`}>
                <Plus aria-hidden="true" />
                New Note
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[minmax(260px,1fr)_120px_150px_150px] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
                    <div>Title</div>
                    <div>Type</div>
                    <div>Updated</div>
                    <div>Created</div>
                  </div>
                  <div className="divide-y divide-border">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="grid grid-cols-[minmax(260px,1fr)_120px_150px_150px] items-center gap-3 px-3 py-3 text-sm"
                      >
                        <Link
                          href={`/notes/${note.id}`}
                          className="min-w-0 font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          <span className="block truncate">{note.title}</span>
                        </Link>
                        <div>
                          <Badge variant="outline">
                            {learningNoteTypeLabels[note.noteType]}
                          </Badge>
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
            ) : (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <NotebookText aria-hidden="true" className="size-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-medium">
                    Note はまだありません
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    この Resource から学んだことを Note として保存します。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derived Questions</CardTitle>
            <CardDescription>
              この Resource から作成された Question
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(260px,1fr)_120px_120px_150px] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
                    <div>Title</div>
                    <div>Difficulty</div>
                    <div>Status</div>
                    <div>Created</div>
                  </div>
                  <div className="divide-y divide-border">
                    {questions.map((question) => (
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
                    Knowledge Links から作成した復習問題がここに表示されます。
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
