import { z } from 'zod';

// The fields every song reader needs; the songs and setlists APIs both return at least these.
export const readerSongSchema = z.object({
  _id: z.string(),
  title: z.string(),
  artist: z.string(),
  originalKey: z.string(),
  chordLyrics: z.string(),
  code: z.string().nullish(),
  year: z.string().nullish(),
  tempo: z.array(z.string()),
  timeSignature: z.array(z.string()),
  themes: z.array(z.string()),
});

export type ReaderSong = z.infer<typeof readerSongSchema>;
