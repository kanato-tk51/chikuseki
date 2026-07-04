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

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const { id } = await params;
  const resource = await getResourceById(id);

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
      </div>
    </main>
  );
}
