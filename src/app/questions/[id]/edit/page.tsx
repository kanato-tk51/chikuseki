import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateQuestionAction } from "@/features/questions/actions";
import { QuestionForm } from "@/features/questions/components/question-form";
import { getQuestionById } from "@/features/questions/queries";
import { questionToFormData } from "@/features/questions/validators";

export const dynamic = "force-dynamic";

type EditQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) {
    notFound();
  }

  const action = updateQuestionAction.bind(null, question.id);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-semibold tracking-normal">
              Edit Question
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {question.title}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/questions/${question.id}`}>
              <ArrowLeft aria-hidden="true" />
              Details
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Question details</CardTitle>
            <CardDescription>
              変更後に保存すると詳細画面へ戻ります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm
              action={action}
              cancelHref={`/questions/${question.id}`}
              initialValues={questionToFormData(question)}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
