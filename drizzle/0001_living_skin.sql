CREATE TYPE "public"."knowledge_curation_status" AS ENUM('draft', 'reviewed', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."knowledge_node_level" AS ENUM('domain', 'knowledge_area', 'topic_cluster', 'concept', 'term');--> statement-breakpoint
CREATE TYPE "public"."knowledge_progress_status" AS ENUM('unknown', 'interested', 'learning', 'understood', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."knowledge_relation_type" AS ENUM('related', 'prerequisite', 'compare_with', 'used_in', 'broader', 'narrower');--> statement-breakpoint
CREATE TABLE "knowledge_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"from_ref" text NOT NULL,
	"to_ref" text NOT NULL,
	"relation_type" "knowledge_relation_type" NOT NULL,
	"reason" text NOT NULL,
	"edge_scope" text DEFAULT 'local' NOT NULL,
	"source_file" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"relation_type" text DEFAULT 'related' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_node_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"status" "knowledge_progress_status" DEFAULT 'unknown' NOT NULL,
	"interest_level" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_key" text NOT NULL,
	"domain_slug" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"level" "knowledge_node_level" NOT NULL,
	"parent_id" uuid,
	"summary" text NOT NULL,
	"why_learn" text,
	"prompt_hint" text,
	"boundary_notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"curation_status" "knowledge_curation_status" DEFAULT 'draft' NOT NULL,
	"source_file" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_aliases" ADD CONSTRAINT "knowledge_aliases_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_from_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_to_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entity_links" ADD CONSTRAINT "knowledge_entity_links_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_node_progress" ADD CONSTRAINT "knowledge_node_progress_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_parent_id_knowledge_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_aliases_node_alias_unique" ON "knowledge_aliases" USING btree ("node_id","alias");--> statement-breakpoint
CREATE INDEX "knowledge_aliases_node_id_idx" ON "knowledge_aliases" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_aliases_alias_idx" ON "knowledge_aliases" USING btree ("alias");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_edges_relation_unique" ON "knowledge_edges" USING btree ("from_node_id","to_node_id","relation_type");--> statement-breakpoint
CREATE INDEX "knowledge_edges_from_node_id_idx" ON "knowledge_edges" USING btree ("from_node_id");--> statement-breakpoint
CREATE INDEX "knowledge_edges_to_node_id_idx" ON "knowledge_edges" USING btree ("to_node_id");--> statement-breakpoint
CREATE INDEX "knowledge_edges_relation_type_idx" ON "knowledge_edges" USING btree ("relation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_entity_links_unique" ON "knowledge_entity_links" USING btree ("node_id","entity_type","entity_id","relation_type");--> statement-breakpoint
CREATE INDEX "knowledge_entity_links_node_id_idx" ON "knowledge_entity_links" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_entity_links_entity_idx" ON "knowledge_entity_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_node_progress_node_unique" ON "knowledge_node_progress" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_node_progress_status_idx" ON "knowledge_node_progress" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_nodes_node_key_unique" ON "knowledge_nodes" USING btree ("node_key");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_nodes_domain_slug_unique" ON "knowledge_nodes" USING btree ("domain_slug","slug");--> statement-breakpoint
CREATE INDEX "knowledge_nodes_domain_idx" ON "knowledge_nodes" USING btree ("domain_slug");--> statement-breakpoint
CREATE INDEX "knowledge_nodes_level_idx" ON "knowledge_nodes" USING btree ("level");--> statement-breakpoint
CREATE INDEX "knowledge_nodes_parent_id_idx" ON "knowledge_nodes" USING btree ("parent_id");