import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import {
  knowledgeProgressStatusLabels,
  type KnowledgeProgressStatus,
} from "@/features/knowledge-map/validators";

const statusVariant: Record<
  KnowledgeProgressStatus,
  ComponentProps<typeof Badge>["variant"]
> = {
  unknown: "outline",
  interested: "secondary",
  learning: "default",
  understood: "secondary",
  ignored: "destructive",
};

export function KnowledgeStatusBadge({
  status,
}: {
  status: KnowledgeProgressStatus;
}) {
  return (
    <Badge variant={statusVariant[status]}>
      {knowledgeProgressStatusLabels[status]}
    </Badge>
  );
}
