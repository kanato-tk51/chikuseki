CREATE TYPE "public"."knowledge_related_item_type" AS ENUM('library', 'framework', 'tool', 'standard', 'protocol', 'service', 'platform', 'pattern', 'language', 'method', 'other');--> statement-breakpoint
CREATE TYPE "public"."knowledge_search_keyword_type" AS ENUM('keyword', 'common_signal', 'anti_signal');--> statement-breakpoint
CREATE TABLE "knowledge_node_related_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"related_item_id" uuid NOT NULL,
	"relevance" text NOT NULL,
	"source_file" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_node_search_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"search_text" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_node_search_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"keyword_type" "knowledge_search_keyword_type" DEFAULT 'keyword' NOT NULL,
	"source_file" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_related_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"item_type" "knowledge_related_item_type" NOT NULL,
	"official_url" text,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_node_related_items" ADD CONSTRAINT "knowledge_node_related_items_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_node_related_items" ADD CONSTRAINT "knowledge_node_related_items_related_item_id_knowledge_related_items_id_fk" FOREIGN KEY ("related_item_id") REFERENCES "public"."knowledge_related_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_node_search_documents" ADD CONSTRAINT "knowledge_node_search_documents_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_node_search_keywords" ADD CONSTRAINT "knowledge_node_search_keywords_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_node_related_items_unique" ON "knowledge_node_related_items" USING btree ("node_id","related_item_id");--> statement-breakpoint
CREATE INDEX "knowledge_node_related_items_node_id_idx" ON "knowledge_node_related_items" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_node_related_items_related_item_id_idx" ON "knowledge_node_related_items" USING btree ("related_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_node_search_documents_node_unique" ON "knowledge_node_search_documents" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_node_search_documents_node_id_idx" ON "knowledge_node_search_documents" USING btree ("node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_node_search_keywords_unique" ON "knowledge_node_search_keywords" USING btree ("node_id","keyword","keyword_type");--> statement-breakpoint
CREATE INDEX "knowledge_node_search_keywords_node_id_idx" ON "knowledge_node_search_keywords" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "knowledge_node_search_keywords_keyword_idx" ON "knowledge_node_search_keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "knowledge_node_search_keywords_type_idx" ON "knowledge_node_search_keywords" USING btree ("keyword_type");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_related_items_name_type_unique" ON "knowledge_related_items" USING btree ("name","item_type");--> statement-breakpoint
CREATE INDEX "knowledge_related_items_name_idx" ON "knowledge_related_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "knowledge_related_items_type_idx" ON "knowledge_related_items" USING btree ("item_type");