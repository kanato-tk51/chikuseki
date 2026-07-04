import { PlaceholderPage } from "@/components/placeholder-page";

export default function TodayReviewsPage() {
  return (
    <PlaceholderPage
      title="Today Reviews"
      description="今日の復習対象を扱う場所"
      status="Next"
      items={["review_items", "review_logs", "question_cards"]}
    />
  );
}
