import { PlaceholderPage } from "@/components/placeholder-page";

export default function QuestionsPage() {
  return (
    <PlaceholderPage
      title="Questions"
      description="復習できる問いに変換する場所"
      status="Next"
      items={["question_cards", "review_items", "tags"]}
    />
  );
}
