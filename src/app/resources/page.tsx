import { PlaceholderPage } from "@/components/placeholder-page";

export default function ResourcesPage() {
  return (
    <PlaceholderPage
      title="Resources"
      description="学習元を蓄積する入口"
      status="Next"
      items={["resources", "entity_tags", "entity_links"]}
    />
  );
}
