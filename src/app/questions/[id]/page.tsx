import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, ListChecks } from "lucide-react";

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
import { DeleteQuestionForm } from "@/features/questions/components/delete-question-form";
import { getQuestionById } from "@/features/questions/queries";
import {
  difficultyLabels,
  questionStatusLabels,
} from "@/features/questions/validators";
import { addQuestionToReviewQueueAction } from "@/features/reviews/actions";
import { getQuestionReviewItem } from "@/features/reviews/queries";
import { reviewResultLabels } from "@/features/reviews/validators";

export const dynamic = "force-dynamic";

type QuestionDetailPageProps = {
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

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {value ? (
        <div className="min-h-40 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-6 text-foreground">
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

function questionKnowledgeText(
  question: NonNullable<Awaited<ReturnType<typeof getQuestionById>>>,
) {
  return [
    question.title,
    question.questionMd,
    question.answerMd,
    question.explanationMd,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n\n");
}

export default async function QuestionDetailPage({
  params,
}: QuestionDetailPageProps) {
  const { id } = await params;
  const [question, domains, linkedKnowledgeNodes] = await Promise.all([
    getQuestionById(id),
    listKnowledgeDomains(),
    listKnowledgeLinksForEntity({
      entityType: "question_card",
      entityId: id,
    }),
  ]);

  if (!question) {
    notFound();
  }

  const reviewItem = await getQuestionReviewItem(question.id);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {difficultyLabels[question.difficulty]}
              </Badge>
              <Badge variant="outline">
                {questionStatusLabels[question.status]}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {question.id}
              </span>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-normal">
              {question.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/questions">
                <ArrowLeft aria-hidden="true" />
                Questions
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/questions/${question.id}/edit`}>
                <Edit aria-hidden="true" />
                Edit
              </Link>
            </Button>
            {reviewItem ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/reviews/today">
                  <ListChecks aria-hidden="true" />
                  Review queued
                </Link>
              </Button>
            ) : (
              <form action={addQuestionToReviewQueueAction}>
                <input type="hidden" name="questionId" value={question.id} />
                <Button type="submit" variant="outline" size="sm">
                  <ListChecks aria-hidden="true" />
                  Add to reviews
                </Button>
              </form>
            )}
            <DeleteQuestionForm
              questionId={question.id}
              questionTitle={question.title}
            />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Question として保存されている基本情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Difficulty">
                <Badge variant="outline">
                  {difficultyLabels[question.difficulty]}
                </Badge>
              </DetailRow>
              <DetailRow label="Status">
                <Badge variant="outline">
                  {questionStatusLabels[question.status]}
                </Badge>
              </DetailRow>
              <DetailRow label="Review">
                {reviewItem ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      Next {formatDateTime(reviewItem.nextReviewAt)}
                    </Badge>
                    {reviewItem.lastResult ? (
                      <Badge variant="secondary">
                        Last {reviewResultLabels[reviewItem.lastResult]}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">未登録</span>
                )}
              </DetailRow>
              <Separator />
              <DetailRow label="Created">
                <span className="font-mono text-xs">
                  {formatDateTime(question.createdAt)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="font-mono text-xs">
                  {formatDateTime(question.updatedAt)}
                </span>
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <TextBlock title="Question" value={question.questionMd} />
          <TextBlock title="Answer" value={question.answerMd} />
          <TextBlock title="Explanation" value={question.explanationMd} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Links</CardTitle>
            <CardDescription>
              この Question を Knowledge Map のノードに接続する
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeLinkerForm
              domains={domains}
              initialText={questionKnowledgeText(question)}
              targetEntity={{
                entityType: "question_card",
                entityId: question.id,
                label: question.title,
              }}
              linkedNodes={linkedKnowledgeNodes}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
