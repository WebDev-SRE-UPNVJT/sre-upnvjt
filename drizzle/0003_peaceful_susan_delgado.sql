CREATE TABLE "pageView" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"visitorId" varchar(36) NOT NULL,
	"userId" integer,
	"deviceType" varchar(20),
	"browser" varchar(100),
	"referrer" text,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pageView" ADD CONSTRAINT "pageView_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;