import Link from "next/link";
import { ArrowLeft, ClipboardPaste, FileJson, Sparkles } from "lucide-react";

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
import {
  chatGptImportPrompt,
  chatGptImportTemplate,
} from "@/features/imports/chatgpt-template";
import { ChatGptImportForm } from "@/features/imports/components/chatgpt-import-form";

const readOnlyTextareaClassName =
  "min-h-80 w-full resize-y rounded-lg border border-input bg-muted/30 px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none";

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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  <CardTitle>Prompt</CardTitle>
                </div>
                <CardDescription>
                  ブラウザ版 ChatGPT に渡す変換プロンプト
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  readOnly
                  value={chatGptImportPrompt}
                  className={readOnlyTextareaClassName}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileJson
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  <CardTitle>JSON Template</CardTitle>
                </div>
                <CardDescription>
                  OpenAI API の structured output でも使う取り込み形式
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  readOnly
                  value={chatGptImportTemplate}
                  className={readOnlyTextareaClassName}
                />
              </CardContent>
            </Card>
          </div>

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
                JSON を貼り付けると、必要に応じて Resource を作り、Note と
                Question draft を保存します
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
