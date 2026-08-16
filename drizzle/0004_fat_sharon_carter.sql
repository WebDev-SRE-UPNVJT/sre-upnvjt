CREATE TABLE "featuredProject" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'ONGOING' NOT NULL,
	"description" text NOT NULL,
	"imageUrl" varchar(1000),
	"isPublished" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdById" integer NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "link" varchar(1000);--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "linkType" varchar(50) DEFAULT 'detail' NOT NULL;--> statement-breakpoint
ALTER TABLE "featuredProject" ADD CONSTRAINT "featuredProject_createdById_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;