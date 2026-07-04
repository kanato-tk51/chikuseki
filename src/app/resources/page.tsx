import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  LibraryBig,
  Plus,
  Search,
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
import { listResources } from "@/features/resources/queries";
import { resourceTypeLabels } from "@/features/resources/validators";

export const dynamic = "force-dynamic";

type ResourcesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

function formatUrl(value: string | null) {
  if (!value) {
    return "未設定";
  }

  try {
    const url = new URL(value);

    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return value;
  }
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const resources = await listResources({ q });
  const hasSearch = q.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                Resources
              </h1>
              <Badge variant="secondary">CRUD</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              学習元を保存し、後から検索して見返す入口
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
              <Link href="/resources/new">
                <Plus aria-hidden="true" />
                New Resource
              </Link>
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <form
            action="/resources"
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Search resources</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search title, URL, summary, memo"
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
                  <Link href="/resources">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>

          {resources.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Resource list</CardTitle>
                <CardDescription>
                  {hasSearch
                    ? `${resources.length}件の検索結果`
                    : `${resources.length}件の Resource`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[820px]">
                    <div className="grid grid-cols-[minmax(240px,1fr)_120px_minmax(240px,1fr)_140px_140px] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
                      <div>Title</div>
                      <div>Type</div>
                      <div>URL</div>
                      <div>Consumed</div>
                      <div>Created</div>
                    </div>
                    <div className="divide-y divide-border">
                      {resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="grid grid-cols-[minmax(240px,1fr)_120px_minmax(240px,1fr)_140px_140px] items-center gap-3 px-3 py-3 text-sm"
                        >
                          <Link
                            href={`/resources/${resource.id}`}
                            className="min-w-0 font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            <span className="block truncate">
                              {resource.title}
                            </span>
                          </Link>
                          <div>
                            <Badge variant="outline">
                              {resourceTypeLabels[resource.type]}
                            </Badge>
                          </div>
                          <div className="min-w-0">
                            {resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-full items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                              >
                                <span className="truncate">
                                  {formatUrl(resource.url)}
                                </span>
                                <ExternalLink
                                  aria-hidden="true"
                                  className="size-3 shrink-0"
                                />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">
                                未設定
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {formatDate(resource.consumedAt)}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {formatDate(resource.createdAt)}
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
                  <LibraryBig aria-hidden="true" className="size-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-medium">
                    {hasSearch ? "検索結果がありません" : "Resource はまだありません"}
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {hasSearch
                      ? "検索語を変えるか、一覧に戻って確認してください。"
                      : "記事、書籍、動画、Docs などの学習元をまず1件保存します。"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {hasSearch ? (
                    <Button asChild variant="outline">
                      <Link href="/resources">Clear search</Link>
                    </Button>
                  ) : null}
                  <Button asChild>
                    <Link href="/resources/new">
                      <Plus aria-hidden="true" />
                      New Resource
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
