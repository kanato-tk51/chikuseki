import Link from "next/link";
import { ArrowRight, BookOpenCheck, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KnowledgeStatusBadge } from "@/features/knowledge-map/components/status-badge";
import {
  listKnowledgeDomains,
  searchKnowledgeNodes,
  type KnowledgeProgressCounts,
} from "@/features/knowledge-map/queries";
import {
  knowledgeNodeLevelLabels,
  knowledgeNodeLevels,
  knowledgeProgressStatusLabels,
  knowledgeProgressStatuses,
  type KnowledgeNodeLevel,
  type KnowledgeProgressStatus,
} from "@/features/knowledge-map/validators";

export const dynamic = "force-dynamic";

type KnowledgeMapPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    level?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isProgressStatus(value: string): value is KnowledgeProgressStatus {
  return knowledgeProgressStatuses.includes(value as KnowledgeProgressStatus);
}

function isNodeLevel(value: string): value is KnowledgeNodeLevel {
  return knowledgeNodeLevels.includes(value as KnowledgeNodeLevel);
}

function progressPercent(counts: KnowledgeProgressCounts & { total: number }) {
  if (counts.total === 0) {
    return 0;
  }

  return Math.round((counts.understood / counts.total) * 100);
}

function ProgressStrip({
  counts,
}: {
  counts: KnowledgeProgressCounts & { total: number };
}) {
  const understood = progressPercent(counts);

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${understood}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Total {counts.total}</span>
        <span>Unknown {counts.unknown}</span>
        <span>Learning {counts.learning}</span>
        <span>Understood {counts.understood}</span>
      </div>
    </div>
  );
}

export default async function KnowledgeMapPage({
  searchParams,
}: KnowledgeMapPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const statusParam = firstParam(params.status)?.trim() ?? "";
  const levelParam = firstParam(params.level)?.trim() ?? "";
  const status = isProgressStatus(statusParam) ? statusParam : undefined;
  const level = isNodeLevel(levelParam) ? levelParam : undefined;
  const hasFilters = q.length > 0 || Boolean(status) || Boolean(level);
  const [domains, searchResults] = await Promise.all([
    listKnowledgeDomains(),
    hasFilters ? searchKnowledgeNodes({ q, status, level }) : Promise.resolve([]),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                Knowledge Map
              </h1>
              <Badge variant="secondary">{domains.length} Domains</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Domain、概念、用語、理解状態を横断して見るためのマスター
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <form
            action="/knowledge-map"
            className="grid gap-2 rounded-xl border border-border bg-card p-3 lg:grid-cols-[1fr_180px_180px_auto]"
          >
            <label className="relative min-w-0">
              <span className="sr-only">Search knowledge map</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Term, framework, library, alias"
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select
                name="status"
                defaultValue={status ?? ""}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Any status</option>
                {knowledgeProgressStatuses.map((progressStatus) => (
                  <option key={progressStatus} value={progressStatus}>
                    {knowledgeProgressStatusLabels[progressStatus]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Level</span>
              <select
                name="level"
                defaultValue={level ?? ""}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Any level</option>
                {knowledgeNodeLevels.map((nodeLevel) => (
                  <option key={nodeLevel} value={nodeLevel}>
                    {knowledgeNodeLevelLabels[nodeLevel]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 lg:flex-none">
                <Search aria-hidden="true" />
                Search
              </Button>
              {hasFilters ? (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 lg:flex-none"
                >
                  <Link href="/knowledge-map">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>

          {hasFilters ? (
            <Card>
              <CardHeader>
                <CardTitle>Search results</CardTitle>
                <CardDescription>{searchResults.length}件</CardDescription>
              </CardHeader>
              <CardContent>
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-border">
                    {searchResults.map((node) => (
                      <Link
                        key={node.id}
                        href={`/knowledge-map/${node.domainSlug}?node=${node.slug}`}
                        className="grid gap-2 px-1 py-3 text-sm transition-colors hover:bg-muted/40 sm:grid-cols-[170px_minmax(220px,1fr)_110px_110px]"
                      >
                        <div className="min-w-0 font-mono text-xs text-muted-foreground">
                          <span className="block truncate">
                            {node.domainSlug}
                          </span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="truncate font-medium text-foreground">
                            {node.name}
                          </div>
                          <div className="line-clamp-2 text-muted-foreground">
                            {node.summary}
                          </div>
                          {node.matchedAliases.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {node.matchedAliases.slice(0, 4).map((alias) => (
                                <Badge key={alias} variant="outline">
                                  {alias}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <Badge variant="outline">
                            {knowledgeNodeLevelLabels[node.level]}
                          </Badge>
                        </div>
                        <div>
                          <KnowledgeStatusBadge status={node.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <SlidersHorizontal aria-hidden="true" className="size-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      条件に一致する node はありません
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate">{domain.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {domain.summary}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{progressPercent(domain.counts)}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProgressStrip counts={domain.counts} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/knowledge-map/${domain.domainSlug}`}>
                      <BookOpenCheck aria-hidden="true" />
                      Open
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
