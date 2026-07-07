import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listKnowledgeDomains } from "@/features/knowledge-map/queries";
import { KnowledgeLinkerForm } from "@/features/knowledge-linker/components/knowledge-linker-form";

export const dynamic = "force-dynamic";

export default async function KnowledgeLinkerPage() {
  const domains = await listKnowledgeDomains();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                Knowledge Linker
              </h1>
              <Badge variant="secondary">Candidate Generator</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              外部テキストから関連しそうな Knowledge Node 候補を抽出します
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Home
            </Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 aria-hidden="true" className="size-4 text-muted-foreground" />
              <CardTitle>Text to Knowledge Nodes</CardTitle>
            </div>
            <CardDescription>
              まずは候補と理由だけを出します。採用/却下はこの画面内の確認用です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeLinkerForm
              domains={domains.map((domain) => ({
                domainSlug: domain.domainSlug,
                name: domain.name,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
