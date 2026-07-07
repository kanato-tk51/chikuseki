import Link from "next/link";
import type { ComponentProps } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Gauge,
  ListChecks,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  listKnowledgeLinksForQuestionIds,
  type KnowledgeLinkedNode,
} from "@/features/knowledge-linker/queries";
import { difficultyLabels } from "@/features/questions/validators";
import { submitReviewResultAction } from "@/features/reviews/actions";
import { listTodayReviewItems } from "@/features/reviews/queries";
import {
  type ReviewResult,
  reviewResultDescriptions,
  reviewResultLabels,
  reviewResults,
} from "@/features/reviews/validators";

export const dynamic = "force-dynamic";

type TodayReviewItem = Awaited<ReturnType<typeof listTodayReviewItems>>[number];

const resultIcons: Record<ReviewResult, LucideIcon> = {
  again: RotateCcw,
  hard: Gauge,
  good: Check,
  easy: Sparkles,
};

const resultVariants: Record<
  ReviewResult,
  ComponentProps<typeof Button>["variant"]
> = {
  again: "destructive",
  hard: "outline",
  good: "default",
  easy: "secondary",
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

function ReviewTextBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {value ? (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-6 text-foreground">
          {value}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          未設定
        </div>
      )}
    </section>
  );
}

function ReviewItemCard({
  item,
  linkedNodes,
}: {
  item: TodayReviewItem;
  linkedNodes: KnowledgeLinkedNode[];
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {difficultyLabels[item.difficulty]}
              </Badge>
              <Badge variant="secondary">
                Due {formatDateTime(item.nextReviewAt)}
              </Badge>
              {item.lastResult ? (
                <Badge variant="outline">
                  Last {reviewResultLabels[item.lastResult]}
                </Badge>
              ) : null}
            </div>
            <CardTitle className="text-lg">{item.questionTitle}</CardTitle>
            <CardDescription>
              Interval {item.intervalDays} days / Ease{" "}
              {item.ease.toFixed(2)}
            </CardDescription>
            {linkedNodes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {linkedNodes.slice(0, 6).map((node) => (
                  <Link
                    key={`${item.questionId}-${node.id}-${node.relationType}`}
                    href={`/knowledge-map/${node.domainSlug}?node=${node.slug}`}
                    className="inline-flex min-h-6 max-w-full items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                  >
                    <span className="max-w-44 truncate">{node.name}</span>
                    <KnowledgeStatusBadge status={node.status} />
                  </Link>
                ))}
                {linkedNodes.length > 6 ? (
                  <Badge variant="outline">+{linkedNodes.length - 6}</Badge>
                ) : null}
              </div>
            ) : null}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/questions/${item.questionId}`}>Question</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReviewTextBlock title="Question" value={item.questionMd} />

        <details className="group rounded-lg border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            <span>Answer</span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <ReviewTextBlock title="Answer" value={item.answerMd} />
            <ReviewTextBlock title="Explanation" value={item.explanationMd} />

            <form
              action={submitReviewResultAction}
              className="space-y-3 border-t border-border pt-4"
            >
              <input
                type="hidden"
                name="reviewItemId"
                value={item.reviewItemId}
              />
              <div className="grid gap-2 sm:grid-cols-4">
                {reviewResults.map((result) => {
                  const Icon = resultIcons[result];

                  return (
                    <Button
                      key={result}
                      type="submit"
                      name="result"
                      value={result}
                      variant={resultVariants[result]}
                      className="h-auto min-h-12 flex-col gap-1 px-3 py-2 sm:items-start"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon aria-hidden="true" className="size-4" />
                        {reviewResultLabels[result]}
                      </span>
                      <span className="text-xs font-normal opacity-80">
                        {reviewResultDescriptions[result]}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </form>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export default async function TodayReviewsPage() {
  const reviewItems = await listTodayReviewItems();
  const knowledgeLinksByQuestionId = await listKnowledgeLinksForQuestionIds(
    reviewItems.map((item) => item.questionId),
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                Today Reviews
              </h1>
              <Badge variant="secondary">{reviewItems.length} due</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              今日の復習対象を処理する場所
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
              <Link href="/questions">
                <ListChecks aria-hidden="true" />
                Questions
              </Link>
            </Button>
          </div>
        </header>

        {reviewItems.length > 0 ? (
          <section className="space-y-4">
            {reviewItems.map((item) => (
              <ReviewItemCard
                key={item.reviewItemId}
                item={item}
                linkedNodes={knowledgeLinksByQuestionId.get(item.questionId) ?? []}
              />
            ))}
          </section>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                <ListChecks aria-hidden="true" className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-medium">
                  今日の復習対象はありません
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Question 詳細から復習対象に追加すると、ここに表示されます。
                </p>
              </div>
              <Button asChild>
                <Link href="/questions">
                  <ListChecks aria-hidden="true" />
                  Questions
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
