import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  GitBranch,
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
import { Separator } from "@/components/ui/separator";
import { KnowledgeProgressForm } from "@/features/knowledge-map/components/progress-form";
import { KnowledgeStatusBadge } from "@/features/knowledge-map/components/status-badge";
import {
  getKnowledgeDomainOverview,
  searchKnowledgeNodes,
  type KnowledgeProgressCounts,
  type KnowledgeTreeNode,
} from "@/features/knowledge-map/queries";
import {
  knowledgeNodeLevelLabels,
} from "@/features/knowledge-map/validators";
import { listKnowledgeLinkedEntitiesForNode } from "@/features/knowledge-linker/queries";
import { knowledgeLinkableEntityTypeLabels } from "@/features/knowledge-linker/validators";

export const dynamic = "force-dynamic";

type KnowledgeDomainPageProps = {
  params: Promise<{
    domainSlug: string;
  }>;
  searchParams: Promise<{
    node?: string | string[];
    q?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-5">
        <span>Total {counts.total}</span>
        <span>Unknown {counts.unknown}</span>
        <span>Interested {counts.interested}</span>
        <span>Learning {counts.learning}</span>
        <span>Understood {counts.understood}</span>
      </div>
    </div>
  );
}

function TreeItem({
  node,
  domainSlug,
  selectedSlug,
  depth = 0,
}: {
  node: KnowledgeTreeNode;
  domainSlug: string;
  selectedSlug: string;
  depth?: number;
}) {
  const isSelected = node.slug === selectedSlug;

  return (
    <li>
      <Link
        href={`/knowledge-map/${domainSlug}?node=${node.slug}`}
        className={`grid min-h-9 grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
          isSelected
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-muted"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{node.name}</span>
          <span
            className={`block truncate text-xs ${
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {knowledgeNodeLevelLabels[node.level]}
          </span>
        </span>
        <span
          className={`size-2 rounded-full ${
            node.status === "understood"
              ? "bg-emerald-400"
              : node.status === "learning"
                ? "bg-sky-400"
                : node.status === "interested"
                  ? "bg-amber-400"
                  : node.status === "ignored"
                    ? "bg-destructive"
                    : "bg-muted-foreground/40"
          }`}
          aria-hidden="true"
        />
      </Link>
      {node.children.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              domainSlug={domainSlug}
              selectedSlug={selectedSlug}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function TextSection({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {value ? (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6 text-foreground">
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

export default async function KnowledgeDomainPage({
  params,
  searchParams,
}: KnowledgeDomainPageProps) {
  const [{ domainSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const selectedSlug = firstParam(resolvedSearchParams.node)?.trim();
  const q = firstParam(resolvedSearchParams.q)?.trim() ?? "";
  const overview = await getKnowledgeDomainOverview({
    domainSlug,
    selectedSlug,
  });

  if (!overview) {
    notFound();
  }

  const selected = overview.selectedNode;
  const linkedEntities = await listKnowledgeLinkedEntitiesForNode(selected.id);
  const returnTo = `/knowledge-map/${domainSlug}?node=${selected.slug}`;
  const searchResults =
    q.length > 0
      ? await searchKnowledgeNodes({ q, domainSlug })
      : [];
  const sortedAreaCounts = [...overview.knowledgeAreaCounts].sort((a, b) => {
    return b.counts.unknown - a.counts.unknown || a.name.localeCompare(b.name);
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Knowledge Map</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {domainSlug}
              </span>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-normal">
              {overview.domain.name}
            </h1>
            <p className="max-w-4xl text-sm text-muted-foreground">
              {overview.domain.summary}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/knowledge-map">
              <ArrowLeft aria-hidden="true" />
              Knowledge Map
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Domain progress</CardTitle>
              <CardDescription>
                {progressPercent(overview.counts)}% understood
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressStrip counts={overview.counts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Areas</CardTitle>
              <CardDescription>
                {overview.knowledgeAreaCounts.length} areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {sortedAreaCounts.slice(0, 6).map((area) => (
                  <Link
                    key={area.id}
                    href={`/knowledge-map/${domainSlug}?node=${area.slug}`}
                    className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-medium">
                        {area.name}
                      </span>
                      <Badge variant="outline">
                        {progressPercent(area.counts)}%
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Unknown {area.counts.unknown} / Total {area.counts.total}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            <form
              action={`/knowledge-map/${domainSlug}`}
              className="flex gap-2 rounded-xl border border-border bg-card p-3"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search this domain</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Search in this domain"
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>
              <Button type="submit" size="icon" title="Search">
                <Search aria-hidden="true" />
              </Button>
              {q ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/knowledge-map/${domainSlug}`}>Clear</Link>
                </Button>
              ) : null}
            </form>

            {q ? (
              <Card>
                <CardHeader>
                  <CardTitle>Search results</CardTitle>
                  <CardDescription>{searchResults.length}件</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {searchResults.map((node) => (
                      <Link
                        key={node.id}
                        href={`/knowledge-map/${domainSlug}?node=${node.slug}`}
                        className="flex items-start justify-between gap-3 px-1 py-2 text-sm hover:bg-muted/40"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {node.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {knowledgeNodeLevelLabels[node.level]}
                          </span>
                        </span>
                        <KnowledgeStatusBadge status={node.status} />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Tree</CardTitle>
                <CardDescription>{overview.nodes.length} nodes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  <TreeItem
                    node={overview.domain}
                    domainSlug={domainSlug}
                    selectedSlug={selected.slug}
                  />
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {knowledgeNodeLevelLabels[selected.level]}
                      </Badge>
                      <KnowledgeStatusBadge status={selected.status} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {selected.slug}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{selected.name}</CardTitle>
                    <CardDescription>{selected.summary}</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/knowledge-map/${domainSlug}`}>
                      Domain
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <TextSection title="Why Learn" value={selected.whyLearn} />
                  <TextSection title="Prompt Hint" value={selected.promptHint} />
                </div>
                <TextSection
                  title="Boundary Notes"
                  value={selected.boundaryNotes}
                />

                {overview.aliases.length > 0 ? (
                  <section className="space-y-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Aliases
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {overview.aliases.map((alias) => (
                        <Badge key={alias} variant="outline">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </section>
                ) : null}

                <Separator />

                <section className="space-y-3">
                  <h2 className="text-sm font-medium text-foreground">
                    Progress
                  </h2>
                  <KnowledgeProgressForm
                    nodeId={selected.id}
                    status={selected.status}
                    interestLevel={selected.interestLevel}
                    memo={selected.progressMemo}
                    returnTo={returnTo}
                  />
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Nodes</CardTitle>
                <CardDescription>{overview.edges.length} edges</CardDescription>
              </CardHeader>
              <CardContent>
                {overview.edges.length > 0 ? (
                  <div className="divide-y divide-border">
                    {overview.edges.map((edge) => {
                      const href = `/knowledge-map/${edge.otherNode.domainSlug}?node=${edge.otherNode.slug}`;

                      return (
                        <Link
                          key={edge.id}
                          href={href}
                          className="grid gap-3 px-1 py-3 text-sm transition-colors hover:bg-muted/40 sm:grid-cols-[130px_minmax(220px,1fr)]"
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {edge.direction === "outgoing" ? (
                              <GitBranch aria-hidden="true" className="size-3" />
                            ) : (
                              <CornerDownRight
                                aria-hidden="true"
                                className="size-3"
                              />
                            )}
                            <span>{edge.relationType}</span>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">
                                {edge.otherNode.name}
                              </span>
                              {edge.edgeScope !== "local" ? (
                                <Badge variant="outline">
                                  {edge.otherNode.domainSlug}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="line-clamp-2 text-muted-foreground">
                              {edge.reason}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    関連 edge はありません
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked Learning Assets</CardTitle>
                <CardDescription>
                  {linkedEntities.length} Resources / Notes / Questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedEntities.length > 0 ? (
                  <div className="divide-y divide-border">
                    {linkedEntities.map((entity) => (
                      <Link
                        key={`${entity.type}-${entity.id}-${entity.relationType}`}
                        href={entity.href}
                        className="grid gap-2 px-1 py-3 text-sm transition-colors hover:bg-muted/40 sm:grid-cols-[130px_minmax(220px,1fr)]"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {knowledgeLinkableEntityTypeLabels[entity.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entity.relationType}
                          </span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="truncate font-medium">
                            {entity.title}
                          </div>
                          {entity.detail ? (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {entity.detail}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    このノードに接続された Resource / Note / Question はまだありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
