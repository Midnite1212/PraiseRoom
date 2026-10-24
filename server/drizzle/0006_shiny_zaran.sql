ALTER TABLE "songs" ADD COLUMN "credits" text;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_credits_length" CHECK (char_length("songs"."credits") <= 500);