ALTER TABLE "setlist_songs" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "setlist_songs" ADD CONSTRAINT "setlist_songs_note_length" CHECK (char_length("setlist_songs"."note") <= 80);