import Link from "next/link";
import { ArrowLeft, ClipboardPaste, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importChatGptKnowledgeAction } from "@/features/imports/actions";
import { chatGptImportPrompt } from "@/features/imports/chatgpt-template";
import { ChatGptImportForm } from "@/features/imports/components/chatgpt-import-form";
import { CopyableChatGptPrompt } from "@/features/imports/components/copyable-chatgpt-prompt";

export default function ChatGptImportPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">
                ChatGPT Import
              </h1>
              <Badge variant="secondary">Template</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ChatGPT で得た知見を Learning Note と Question draft に変換します
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Home
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <CardTitle>ChatGPT Prompt</CardTitle>
              </div>
              <CardDescription>
                このままコピーして ChatGPT に貼り付ける単一プロンプト
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyableChatGptPrompt value={chatGptImportPrompt} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardPaste
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <CardTitle>Import</CardTitle>
              </div>
              <CardDescription>
                JSON を貼り付けると、Resource、Note、Question draft
                をまとめて保存します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatGptImportForm action={importChatGptKnowledgeAction} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
