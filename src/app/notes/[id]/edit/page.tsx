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
import { updateNoteAction } from "@/features/notes/actions";
import { NoteForm } from "@/features/notes/components/note-form";
import { getNoteById, listResourceOptions } from "@/features/notes/queries";
import { noteToFormData } from "@/features/notes/validators";

export const dynamic = "force-dynamic";

type EditNotePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id } = await params;
  const [note, resourceOptions] = await Promise.all([
    getNoteById(id),
    listResourceOptions(),
  ]);

  if (!note) {
    notFound();
  }

  const action = updateNoteAction.bind(null, note.id);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-semibold tracking-normal">
              Edit Note
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {note.title}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/notes/${note.id}`}>
              <ArrowLeft aria-hidden="true" />
              Details
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Note details</CardTitle>
            <CardDescription>
              変更後に保存すると詳細画面へ戻ります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoteForm
              action={action}
              cancelHref={`/notes/${note.id}`}
              initialValues={noteToFormData(note)}
              resourceOptions={resourceOptions}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
