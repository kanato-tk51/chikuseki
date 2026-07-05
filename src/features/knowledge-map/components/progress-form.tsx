import { updateKnowledgeNodeProgressAction } from "@/features/knowledge-map/actions";
import {
  knowledgeProgressStatusLabels,
  knowledgeProgressStatuses,
  type KnowledgeProgressStatus,
} from "@/features/knowledge-map/validators";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function KnowledgeProgressForm({
  nodeId,
  status,
  interestLevel,
  memo,
  returnTo,
}: {
  nodeId: string;
  status: KnowledgeProgressStatus;
  interestLevel: number;
  memo: string | null;
  returnTo: string;
}) {
  return (
    <form action={updateKnowledgeNodeProgressAction} className="space-y-4">
      <input type="hidden" name="nodeId" value={nodeId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            name="status"
            defaultValue={status}
            className={inputClassName}
          >
            {knowledgeProgressStatuses.map((progressStatus) => (
              <option key={progressStatus} value={progressStatus}>
                {knowledgeProgressStatusLabels[progressStatus]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground">Interest</span>
          <input
            name="interestLevel"
            type="number"
            min={0}
            max={5}
            defaultValue={interestLevel}
            className={inputClassName}
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-foreground">Memo</span>
        <textarea
          name="memo"
          defaultValue={memo ?? ""}
          className={textareaClassName}
          placeholder="気になる理由、次に調べたいこと、理解メモ"
        />
      </label>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" size="sm">
          Save progress
        </Button>
      </div>
    </form>
  );
}
