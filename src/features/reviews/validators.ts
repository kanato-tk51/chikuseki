import { z } from "zod";

export const reviewResults = ["again", "hard", "good", "easy"] as const;
export type ReviewResult = (typeof reviewResults)[number];

export const reviewResultLabels: Record<ReviewResult, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

export const reviewResultDescriptions: Record<ReviewResult, string> = {
  again: "思い出せなかった",
  hard: "かなり迷った",
  good: "だいたい思い出せた",
  easy: "すぐ思い出せた",
};

export const reviewItemIdSchema = z.uuid();

export const reviewSubmissionSchema = z.object({
  reviewItemId: reviewItemIdSchema,
  result: z.enum(reviewResults),
});

export function readReviewSubmissionFormData(formData: FormData) {
  return {
    reviewItemId: formData.get("reviewItemId"),
    result: formData.get("result"),
  };
}
