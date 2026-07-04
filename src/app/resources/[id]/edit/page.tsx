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
import { updateResourceAction } from "@/features/resources/actions";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { getResourceById } from "@/features/resources/queries";
import { resourceToFormData } from "@/features/resources/validators";

export const dynamic = "force-dynamic";

type EditResourcePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditResourcePage({
  params,
}: EditResourcePageProps) {
  const { id } = await params;
  const resource = await getResourceById(id);

  if (!resource) {
    notFound();
  }

  const action = updateResourceAction.bind(null, resource.id);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-semibold tracking-normal">
              Edit Resource
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {resource.title}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/resources/${resource.id}`}>
              <ArrowLeft aria-hidden="true" />
              Details
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Resource details</CardTitle>
            <CardDescription>
              変更後に保存すると詳細画面へ戻ります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourceForm
              action={action}
              cancelHref={`/resources/${resource.id}`}
              initialValues={resourceToFormData(resource)}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
