UPDATE "ownerships" SET "access_type" = CASE WHEN "access_type" = 'admin' THEN 'admin' WHEN "access_type" IN ('ministry', 't3ch', 'tc') THEN 'editor' ELSE 'member' END;--> statement-breakpoint
ALTER TABLE "ownerships" ALTER COLUMN "access_type" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_access_type_known" CHECK ("ownerships"."access_type" in ('member', 'editor', 'admin'));
