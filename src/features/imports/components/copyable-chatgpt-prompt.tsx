"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyableChatGptPromptProps = {
  value: string;
};

const textareaClassName =
  "min-h-[42rem] w-full resize-y rounded-lg border border-input bg-muted/30 px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CopyableChatGptPrompt({
  value,
}: CopyableChatGptPromptProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      textareaRef.current?.select();
      document.execCommand("copy");
      textareaRef.current?.setSelectionRange(0, 0);
    }

    setCopied(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" onClick={handleCopy} variant="outline">
          {copied ? (
            <>
              <Check aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden="true" />
              Copy prompt
            </>
          )}
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        readOnly
        value={value}
        className={textareaClassName}
      />
    </div>
  );
}
