CREATE FUNCTION generate_url_key() RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT string_agg(substr('0123456789abcdefghijklmnopqrstuvwxyz', floor(random() * 36)::int + 1, 1), '')
  FROM generate_series(1, 6)
$$;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "url_key" text DEFAULT generate_url_key() NOT NULL;--> statement-breakpoint
ALTER TABLE "setlists" ADD COLUMN "url_key" text DEFAULT generate_url_key() NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "url_key" text DEFAULT generate_url_key() NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_url_key_unique" UNIQUE("url_key");--> statement-breakpoint
ALTER TABLE "setlists" ADD CONSTRAINT "setlists_url_key_unique" UNIQUE("url_key");--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_url_key_unique" UNIQUE("url_key");--> statement-breakpoint
UPDATE "setlists" SET "public_link" = regexp_replace("public_link", '/setlist/view/[0-9a-f]{24}$', '/setlist/view/' || "url_key") WHERE "public_link" ~ '/setlist/view/[0-9a-f]{24}$';
