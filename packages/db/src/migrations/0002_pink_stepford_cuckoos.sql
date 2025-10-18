CREATE TYPE "public"."request_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'in_progress', 'completed', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('feature', 'bug', 'improvement', 'idea');--> statement-breakpoint
CREATE TABLE "product_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "request_type" NOT NULL,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"priority" "request_priority" DEFAULT 'medium',
	"element_id" text,
	"element_name" text,
	"element_path" text,
	"element_line" text,
	"element_file" text,
	"element_component" text,
	"element_metadata" jsonb,
	"position_x" integer,
	"position_y" integer,
	"width" integer,
	"height" integer,
	"screenshot_url" text,
	"page_url" text,
	"created_by" text NOT NULL,
	"assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_request_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_request_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_request" ADD CONSTRAINT "product_request_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_request" ADD CONSTRAINT "product_request_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_request_comment" ADD CONSTRAINT "product_request_comment_request_id_product_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."product_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_request_comment" ADD CONSTRAINT "product_request_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_request_vote" ADD CONSTRAINT "product_request_vote_request_id_product_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."product_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_request_vote" ADD CONSTRAINT "product_request_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;