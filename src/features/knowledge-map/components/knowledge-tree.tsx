import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { KnowledgeTreeNode } from "@/features/knowledge-map/queries";
import { knowledgeNodeLevelLabels } from "@/features/knowledge-map/validators";
import { cn } from "@/lib/utils";

type KnowledgeTreeProps = {
  root: KnowledgeTreeNode;
  domainSlug: string;
  selectedSlug: string;
};

type TreeItemProps = {
  node: KnowledgeTreeNode;
  domainSlug: string;
  selectedSlug: string;
  initiallyExpandedIds: Set<string>;
  depth?: number;
};

const depthPaddingClasses = ["pl-2", "pl-6", "pl-10", "pl-14", "pl-16"];

function findAncestorIds(root: KnowledgeTreeNode, selectedSlug: string) {
  const ancestors = new Set<string>();

  function visit(node: KnowledgeTreeNode, path: string[]): boolean {
    if (node.slug === selectedSlug) {
      path.forEach((nodeId) => ancestors.add(nodeId));
      return true;
    }

    return node.children.some((child) => visit(child, [...path, node.id]));
  }

  visit(root, []);
  return ancestors;
}

function statusDotClass(status: KnowledgeTreeNode["status"]) {
  if (status === "understood") {
    return "bg-emerald-400";
  }

  if (status === "learning") {
    return "bg-sky-400";
  }

  if (status === "interested") {
    return "bg-amber-400";
  }

  if (status === "ignored") {
    return "bg-destructive";
  }

  return "bg-muted-foreground/40";
}

function NodeLabel({
  node,
  isSelected,
}: {
  node: KnowledgeTreeNode;
  isSelected: boolean;
}) {
  return (
    <span className="min-w-0 flex-1 text-left">
      <span className="block truncate font-medium">{node.name}</span>
      <span
        className={cn(
          "block truncate text-xs",
          isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {knowledgeNodeLevelLabels[node.level]}
      </span>
    </span>
  );
}

function TreeItem({
  node,
  domainSlug,
  selectedSlug,
  initiallyExpandedIds,
  depth = 0,
}: TreeItemProps) {
  const isSelected = node.slug === selectedSlug;
  const hasChildren = node.children.length > 0;
  const depthClass = depthPaddingClasses[Math.min(depth, depthPaddingClasses.length - 1)];
  const rowClassName = cn(
    "min-h-10 rounded-lg pr-2 text-sm transition-colors",
    depthClass,
    isSelected
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-muted",
  );

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={`/knowledge-map/${domainSlug}?node=${node.slug}`}
          className={cn(rowClassName, "flex items-center gap-2 py-1.5")}
        >
          <span aria-hidden="true" className="size-3 shrink-0" />
          <NodeLabel node={node} isSelected={isSelected} />
          <span
            className={cn("size-2 shrink-0 rounded-full", statusDotClass(node.status))}
            aria-hidden="true"
          />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <details open={initiallyExpandedIds.has(node.id)}>
        <summary
          className={cn(
            rowClassName,
            "cursor-pointer py-1.5 marker:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <span className="ml-1 inline-flex w-[calc(100%-1.25rem)] items-center gap-2 align-middle">
            <NodeLabel node={node} isSelected={isSelected} />
            <span
              className={cn("size-2 shrink-0 rounded-full", statusDotClass(node.status))}
              aria-hidden="true"
            />
            <Link
              href={`/knowledge-map/${domainSlug}?node=${node.slug}`}
              aria-label={`${node.name}の詳細を表示`}
              title="詳細を表示"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected
                  ? "hover:bg-primary-foreground/15"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          </span>
        </summary>
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              domainSlug={domainSlug}
              selectedSlug={selectedSlug}
              initiallyExpandedIds={initiallyExpandedIds}
              depth={depth + 1}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

export function KnowledgeTree({
  root,
  domainSlug,
  selectedSlug,
}: KnowledgeTreeProps) {
  const initiallyExpandedIds = findAncestorIds(root, selectedSlug);

  return (
    <ul className="space-y-1">
      <TreeItem
        node={root}
        domainSlug={domainSlug}
        selectedSlug={selectedSlug}
        initiallyExpandedIds={initiallyExpandedIds}
      />
    </ul>
  );
}
