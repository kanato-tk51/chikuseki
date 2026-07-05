import Link from "next/link";
import {
  FileQuestion,
  LibraryBig,
  ListChecks,
  Map,
  NotebookText,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    title: "Knowledge Map",
    description: "分野、概念、用語、理解状態",
    href: "/knowledge-map",
    icon: Map,
    badge: "Map",
  },
  {
    title: "Resources",
    description: "記事、書籍、動画、Docs",
    href: "/resources",
    icon: LibraryBig,
    badge: "Source",
  },
  {
    title: "Notes",
    description: "学んだ内容の記録",
    href: "/notes",
    icon: NotebookText,
    badge: "Note",
  },
  {
    title: "Questions",
    description: "復習用の問い",
    href: "/questions",
    icon: FileQuestion,
    badge: "Recall",
  },
  {
    title: "Reviews",
    description: "今日の復習",
    href: "/reviews/today",
    icon: ListChecks,
    badge: "Review",
  },
  {
    title: "Import",
    description: "外部テキストから取り込み",
    href: "/imports/chatgpt",
    icon: Sparkles,
    badge: "Import",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                chikuseki
              </h1>
              <Badge variant="secondary">Learning OS</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              学習対象を見つけ、記録し、問いに変えて復習するための作業面
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <section.icon aria-hidden="true" className="size-5" />
                    </div>
                    <Badge variant="outline">{section.badge}</Badge>
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                    Open
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
