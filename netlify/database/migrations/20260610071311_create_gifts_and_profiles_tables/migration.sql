CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now(),
	"member_id" uuid,
	"title" text,
	"comment" text,
	"url" text,
	"price" numeric,
	"image_url" text,
	"is_important" boolean,
	"image_from_link_preview" boolean
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"avatar_url" text,
	"mail" text
);
