import { PlaceholderPage } from "@/components/placeholder-page";

export default function NotesPage() {
  return (
    <PlaceholderPage
      title="Notes"
      description="Resource から学びを残す場所"
      status="Next"
      items={["learning_notes", "resources", "tags"]}
    />
  );
}
