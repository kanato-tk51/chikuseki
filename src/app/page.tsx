import Link from "next/link";
import {
  BookOpenText,
  Braces,
  Database,
  FileQuestion,
  LibraryBig,
  ListChecks,
  NotebookText,
} from "lucide-react";

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

const navItems = [
  { label: "Resources", href: "/resources", icon: LibraryBig },
  { label: "Notes", href: "/notes", icon: NotebookText },
  { label: "Questions", href: "/questions", icon: FileQuestion },
  { label: "Reviews", href: "/reviews/today", icon: ListChecks },
];

const foundationItems = [
  {
    title: "App Router",
    description: "Server Components first",
    icon: Braces,
  },
  {
    title: "PostgreSQL",
    description: "Docker Compose ready",
    icon: Database,
  },
  {
    title: "Drizzle",
    description: "Initial schema ready",
    icon: BookOpenText,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                chikuseki
              </h1>
              <Badge variant="secondary">Foundation</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Engineering Learning OS
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="outline" size="sm">
                <Link href={item.href}>
                  <item.icon aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </header>

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline">Next step</Badge>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                Resource から Review までの縦導線を積み上げる土台
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                最初の実装単位は、アプリ shell、DB schema、migration、health
                check までです。
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {foundationItems.map((item) => (
                <Card key={item.title}>
                  <CardHeader className="gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                      <item.icon aria-hidden="true" className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Initial slice</CardTitle>
              <CardDescription>
                Resource - Note - Question - Review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                {["resources", "learning_notes", "question_cards"].map(
                  (table) => (
                    <div
                      key={table}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="font-mono text-muted-foreground">
                        {table}
                      </span>
                      <Badge variant="secondary">schema</Badge>
                    </div>
                  ),
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                {["review_items", "review_logs", "tags"].map((table) => (
                  <div
                    key={table}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-mono text-muted-foreground">
                      {table}
                    </span>
                    <Badge variant="secondary">schema</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
