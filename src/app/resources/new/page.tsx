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
import { createResourceAction } from "@/features/resources/actions";
import { ResourceForm } from "@/features/resources/components/resource-form";

export default function NewResourcePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-normal">
              New Resource
            </h1>
            <p className="text-sm text-muted-foreground">
              学習元のタイトル、URL、メモを保存します
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/resources">
              <ArrowLeft aria-hidden="true" />
              Resources
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Resource details</CardTitle>
            <CardDescription>
              Summary と Memo は一覧検索の対象になります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourceForm
              action={createResourceAction}
              cancelHref="/resources"
              submitLabel="Create Resource"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
