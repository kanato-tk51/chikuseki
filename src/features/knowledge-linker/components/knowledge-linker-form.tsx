"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KnowledgeStatusBadge } from "@/features/knowledge-map/components/status-badge";
import {
  knowledgeNodeLevelLabels,
} from "@/features/knowledge-map/validators";
import type {
  KnowledgeLinkCandidate,
  KnowledgeLinkedNode,
  KnowledgeQuestionDraft,
} from "@/features/knowledge-linker/queries";
import {
  knowledgeLinkableEntityTypeLabels,
  type KnowledgeLinkableEntityType,
  type KnowledgeLinkerMode,
} from "@/features/knowledge-linker/validators";

type KnowledgeLinkerDomainOption = {
  domainSlug: string;
  name: string;
};

type KnowledgeLinkerFormProps = {
  domains: KnowledgeLinkerDomainOption[];
  initialText?: string;
  initialDomainSlug?: string;
  initialMode?: KnowledgeLinkerMode;
  targetEntity?: {
    entityType: KnowledgeLinkableEntityType;
    entityId: string;
    label: string;
  };
  linkedNodes?: KnowledgeLinkedNode[];
};

type Decision = "accepted" | "rejected";

const textareaClassName =
  "min-h-72 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const inputClassName =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function confidenceLabel(confidence: KnowledgeLinkCandidate["confidence"]) {
  if (confidence === "high") {
    return "High";
  }

  if (confidence === "medium") {
    return "Medium";
  }

  return "Low";
}

function modeHelpText(mode: KnowledgeLinkerMode) {
  return mode === "lookup" ? "2-50000文字" : "10-50000文字";
}

function reasonClassName(weight: number) {
  return weight < 0
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-border bg-muted/40 text-muted-foreground";
}

export function KnowledgeLinkerForm({
  domains,
  initialText = "",
  initialDomainSlug = "",
  initialMode = "text",
  targetEntity,
  linkedNodes: initialLinkedNodes = [],
}: KnowledgeLinkerFormProps) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<KnowledgeLinkerMode>(initialMode);
  const [domainSlug, setDomainSlug] = useState(initialDomainSlug);
  const [limit, setLimit] = useState(30);
  const [candidates, setCandidates] = useState<KnowledgeLinkCandidate[]>([]);
  const [linkedNodes, setLinkedNodes] =
    useState<KnowledgeLinkedNode[]>(initialLinkedNodes);
  const [createdDrafts, setCreatedDrafts] = useState<KnowledgeQuestionDraft[]>(
    [],
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingQuestions, setIsCreatingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const linkedNodeIds = useMemo(
    () => new Set(linkedNodes.map((node) => node.id)),
    [linkedNodes],
  );
  const acceptedCandidates = useMemo(
    () =>
      candidates.filter((candidate) => decisions[candidate.id] === "accepted"),
    [candidates, decisions],
  );
  const acceptedCandidatesToSave = useMemo(
    () =>
      acceptedCandidates.filter(
        (candidate) => !linkedNodeIds.has(candidate.id),
      ),
    [acceptedCandidates, linkedNodeIds],
  );
  const rejectedCount = useMemo(
    () =>
      candidates.filter((candidate) => decisions[candidate.id] === "rejected")
        .length,
    [candidates, decisions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveMessage(null);
    setCopied(false);
    setDecisions({});

    try {
      const response = await fetch("/api/knowledge-linker/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          mode,
          domainSlug,
          limit,
        }),
      });
      const payload = (await response.json()) as {
        candidates?: KnowledgeLinkCandidate[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "候補生成に失敗しました");
        setCandidates([]);
        return;
      }

      setCandidates(payload.candidates ?? []);
    } catch {
      setError("候補生成に失敗しました");
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }

  function setDecision(candidateId: string, decision: Decision) {
    setDecisions((current) => {
      if (current[candidateId] === decision) {
        const next = { ...current };
        delete next[candidateId];
        return next;
      }

      return { ...current, [candidateId]: decision };
    });
  }

  async function copyAcceptedRefs() {
    const value = acceptedCandidates
      .map(
        (candidate) =>
          `${candidate.domainSlug}/${candidate.slug} - ${candidate.name}`,
      )
      .join("\n");

    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  async function saveAcceptedRefs() {
    if (!targetEntity || acceptedCandidatesToSave.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/knowledge-linker/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: targetEntity.entityType,
          entityId: targetEntity.entityId,
          nodeIds: acceptedCandidatesToSave.map((candidate) => candidate.id),
          relationType: "covers",
        }),
      });
      const payload = (await response.json()) as {
        savedCount?: number;
        links?: KnowledgeLinkedNode[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Knowledge Node の保存に失敗しました");
        return;
      }

      setLinkedNodes(payload.links ?? linkedNodes);
      setDecisions({});
      setSaveMessage(
        `${payload.savedCount ?? 0}件の Knowledge Node を保存しました`,
      );
    } catch {
      setError("Knowledge Node の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeLinkedNode(node: KnowledgeLinkedNode) {
    if (!targetEntity) {
      return;
    }

    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/knowledge-linker/links", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: targetEntity.entityType,
          entityId: targetEntity.entityId,
          nodeId: node.id,
          relationType: node.relationType,
        }),
      });
      const payload = (await response.json()) as {
        links?: KnowledgeLinkedNode[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Knowledge Link の解除に失敗しました");
        return;
      }

      setLinkedNodes(payload.links ?? []);
      setSaveMessage("Knowledge Link を解除しました");
    } catch {
      setError("Knowledge Link の解除に失敗しました");
    }
  }

  async function createQuestionDrafts() {
    if (
      !targetEntity ||
      targetEntity.entityType === "question_card" ||
      linkedNodes.length === 0
    ) {
      return;
    }

    setIsCreatingQuestions(true);
    setError(null);
    setSaveMessage(null);
    setCreatedDrafts([]);

    try {
      const response = await fetch("/api/knowledge-linker/question-drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: targetEntity.entityType,
          entityId: targetEntity.entityId,
          nodeIds: linkedNodes.map((node) => node.id).slice(0, 20),
        }),
      });
      const payload = (await response.json()) as {
        created?: KnowledgeQuestionDraft[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Question draft の作成に失敗しました");
        return;
      }

      setCreatedDrafts(payload.created ?? []);
      setSaveMessage(`${payload.created?.length ?? 0}件の Question draft を作成しました`);
    } catch {
      setError("Question draft の作成に失敗しました");
    } finally {
      setIsCreatingQuestions(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleSubmit} className="space-y-4">
        {targetEntity ? (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Link target: </span>
            <span className="font-medium">
              {knowledgeLinkableEntityTypeLabels[targetEntity.entityType]}
            </span>
            <span className="text-muted-foreground"> / </span>
            <span className="font-medium">{targetEntity.label}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="linker-text" className="text-sm font-medium">
            Source text
          </label>
          <textarea
            id="linker-text"
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={textareaClassName}
            placeholder="記事、メモ、会話ログ、調べた内容を貼り付ける"
          />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{modeHelpText(mode)}</span>
            <span>{text.trim().length} chars</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[140px_1fr_120px]">
          <label className="space-y-2">
            <span className="text-sm font-medium">Mode</span>
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as KnowledgeLinkerMode)
              }
              className={inputClassName}
            >
              <option value="text">Text</option>
              <option value="lookup">Lookup</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Domain filter</span>
            <select
              value={domainSlug}
              onChange={(event) => setDomainSlug(event.target.value)}
              className={inputClassName}
            >
              <option value="">All domains</option>
              {domains.map((domain) => (
                <option key={domain.domainSlug} value={domain.domainSlug}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Limit</span>
            <input
              type="number"
              min={5}
              max={80}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className={inputClassName}
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Search aria-hidden="true" />
                Generate candidates
              </>
            )}
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{candidates.length} Candidates</Badge>
            <Badge variant="outline">{acceptedCandidates.length} Accepted</Badge>
            <Badge variant="outline">{rejectedCount} Rejected</Badge>
            {targetEntity ? (
              <Badge variant="outline">{linkedNodes.length} Linked</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {targetEntity && targetEntity.entityType !== "question_card" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={linkedNodes.length === 0 || isCreatingQuestions}
                onClick={createQuestionDrafts}
              >
                {isCreatingQuestions ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                Create question drafts
              </Button>
            ) : null}
            {targetEntity ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={acceptedCandidatesToSave.length === 0 || isSaving}
                onClick={saveAcceptedRefs}
              >
                {isSaving ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                Save accepted
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={acceptedCandidates.length === 0}
              onClick={copyAcceptedRefs}
            >
              <Copy aria-hidden="true" />
              {copied ? "Copied" : "Copy accepted"}
            </Button>
          </div>
        </div>

        {createdDrafts.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-sm font-medium">Created drafts</div>
            <div className="space-y-2">
              {createdDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={draft.href}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-2 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {draft.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {draft.nodeName}
                    </span>
                  </span>
                  <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {linkedNodes.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-sm font-medium">Linked nodes</div>
            <div className="flex flex-wrap gap-2">
              {linkedNodes.map((node) => (
                <span
                  key={`${node.id}-${node.relationType}`}
                  className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground"
                >
                  <Link
                    href={`/knowledge-map/${node.domainSlug}?node=${node.slug}`}
                    className="truncate underline-offset-4 hover:underline"
                  >
                    {node.name}
                  </Link>
                  <Badge variant="outline">{node.relationType}</Badge>
                  {targetEntity ? (
                    <button
                      type="button"
                      className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Remove link"
                      onClick={() => void removeLinkedNode(node)}
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {candidates.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
              <Search aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">候補はまだありません</p>
              <p className="text-sm text-muted-foreground">
                テキストを貼り付けて候補生成を実行してください
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const decision = decisions[candidate.id];
              const isLinked = linkedNodeIds.has(candidate.id);

              return (
                <article
                  key={candidate.id}
                  className="space-y-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-medium">
                          {candidate.name}
                        </h2>
                        <Badge variant="outline">
                          {knowledgeNodeLevelLabels[candidate.level]}
                        </Badge>
                        <KnowledgeStatusBadge status={candidate.status} />
                        <Badge
                          variant={
                            candidate.confidence === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {confidenceLabel(candidate.confidence)} ·{" "}
                          {candidate.score}
                        </Badge>
                        {isLinked ? (
                          <Badge variant="secondary">Linked</Badge>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {candidate.summary}
                      </p>
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {candidate.path.map((pathItem, index) => (
                          <span key={pathItem.id} className="truncate">
                            {index > 0 ? " / " : null}
                            {pathItem.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          isLinked || decision === "accepted"
                            ? "default"
                            : "outline"
                        }
                        disabled={isLinked}
                        onClick={() => setDecision(candidate.id, "accepted")}
                      >
                        <Check aria-hidden="true" />
                        {isLinked ? "Linked" : "Accept"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          decision === "rejected" ? "destructive" : "outline"
                        }
                        disabled={isLinked}
                        onClick={() => setDecision(candidate.id, "rejected")}
                      >
                        <X aria-hidden="true" />
                        Reject
                      </Button>
                      <Button asChild type="button" size="sm" variant="outline">
                        <Link
                          href={`/knowledge-map/${candidate.domainSlug}?node=${candidate.slug}`}
                        >
                          <ExternalLink aria-hidden="true" />
                          Open
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {candidate.reasons.map((reason) => (
                      <span
                        key={`${candidate.id}-${reason.source}-${reason.matchedText}`}
                        className={`inline-flex min-h-6 max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs ${reasonClassName(
                          reason.weight,
                        )}`}
                        title={reason.label}
                      >
                        <span className="font-medium">{reason.label}</span>
                        <span className="truncate">{reason.matchedText}</span>
                        <span>
                          {reason.weight > 0
                            ? `+${reason.weight}`
                            : reason.weight}
                        </span>
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
