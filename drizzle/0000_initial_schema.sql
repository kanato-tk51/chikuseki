CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('resource', 'learning_note', 'question_card', 'code_problem', 'project', 'project_log', 'concept', 'output');--> statement-breakpoint
CREATE TYPE "public"."learning_note_type" AS ENUM('resource', 'project', 'concept', 'other');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('article', 'book', 'talk', 'video', 'docs', 'repository', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_result" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."review_target_type" AS ENUM('question_card', 'code_problem');--> statement-breakpoint
CREATE TABLE "entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_type" "entity_type" NOT NULL,
	"from_id" uuid NOT NULL,
	"to_type" "entity_type" NOT NULL,
	"to_id" uuid NOT NULL,
	"relation_type" text DEFAULT 'related' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"note_type" "learning_note_type" DEFAULT 'resource' NOT NULL,
	"resource_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"question_md" text DEFAULT '' NOT NULL,
	"answer_md" text DEFAULT '' NOT NULL,
	"explanation_md" text DEFAULT '' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"status" "question_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "resource_type" DEFAULT 'article' NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"source_name" text,
	"author" text,
	"summary" text,
	"memo" text,
	"published_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "review_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"next_review_at" timestamp with time zone DEFAULT now() NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"ease" double precision DEFAULT 2.5 NOT NULL,
	"last_result" "review_result",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_item_id" uuid NOT NULL,
	"result" "review_result" NOT NULL,
	"memo" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_review_item_id_review_items_id_fk" FOREIGN KEY ("review_item_id") REFERENCES "public"."review_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_links_relation_unique" ON "entity_links" USING btree ("from_type","from_id","to_type","to_id","relation_type");--> statement-breakpoint
CREATE INDEX "entity_links_from_idx" ON "entity_links" USING btree ("from_type","from_id");--> statement-breakpoint
CREATE INDEX "entity_links_to_idx" ON "entity_links" USING btree ("to_type","to_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_tags_entity_tag_unique" ON "entity_tags" USING btree ("entity_type","entity_id","tag_id");--> statement-breakpoint
CREATE INDEX "entity_tags_entity_idx" ON "entity_tags" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "entity_tags_tag_id_idx" ON "entity_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "learning_notes_resource_id_idx" ON "learning_notes" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "learning_notes_created_at_idx" ON "learning_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "question_cards_status_idx" ON "question_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "question_cards_created_at_idx" ON "question_cards" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "resources_type_idx" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_items_target_unique" ON "review_items" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "review_items_next_review_at_idx" ON "review_items" USING btree ("next_review_at");--> statement-breakpoint
CREATE INDEX "review_logs_review_item_id_idx" ON "review_logs" USING btree ("review_item_id");--> statement-breakpoint
CREATE INDEX "review_logs_reviewed_at_idx" ON "review_logs" USING btree ("reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" USING btree ("slug");