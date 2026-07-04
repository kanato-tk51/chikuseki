import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createQuestionAction } from "@/features/questions/actions";
import { QuestionForm } from "@/features/questions/components/question-form";

export const dynamic = "force-dynamic";

export default function NewQuestionPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-normal">
              New Question
            </h1>
            <p className="text-sm text-muted-foreground">
              復習できる問い、答え、補足を保存します
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/questions">
              <ArrowLeft aria-hidden="true" />
              Questions
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Question details</CardTitle>
            <CardDescription>
              まずは Question 単体を作成します。Note 連携は次の段階で追加します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm
              action={createQuestionAction}
              cancelHref="/questions"
              submitLabel="Create Question"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
