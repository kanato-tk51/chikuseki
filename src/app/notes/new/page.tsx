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
import { createNoteAction } from "@/features/notes/actions";
import { NoteForm } from "@/features/notes/components/note-form";
import { listResourceOptions } from "@/features/notes/queries";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const resourceOptions = await listResourceOptions();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-normal">New Note</h1>
            <p className="text-sm text-muted-foreground">
              Resource から学んだことを Markdown で保存します
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/notes">
              <ArrowLeft aria-hidden="true" />
              Notes
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Note details</CardTitle>
            <CardDescription>
              Resource は任意です。後で関連付け直すこともできます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoteForm
              action={createNoteAction}
              cancelHref="/notes"
              resourceOptions={resourceOptions}
              submitLabel="Create Note"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
