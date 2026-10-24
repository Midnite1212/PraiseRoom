import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { TEMPO_OPTIONS } from '@/features/songs/api';
import { apiRequest } from '@/lib/api-client';

export const IMPORT_SOURCES = ['worshiptogether', 'ultimate-guitar', 'pnwchords'] as const;

export type ImportSource = (typeof IMPORT_SOURCES)[number];

export const TIME_SIGNATURE_OPTIONS = ['4/4', '3/4', '6/8', '2/4', '2/2', '9/8', '12/8'] as const;

const importCandidateSchema = z.object({
  source: z.enum(IMPORT_SOURCES),
  url: z.string(),
  title: z.string(),
  artist: z.string().nullable(),
  votes: z.number().nullable(),
});

const importSearchResponseSchema = z.object({
  candidates: z.array(importCandidateSchema),
  unavailable: z.array(z.enum(IMPORT_SOURCES)),
});

export type ImportSearchResponse = z.infer<typeof importSearchResponseSchema>;

export const importSearchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['song-import', 'search', { q }],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/import/search', importSearchResponseSchema, { query: { q }, signal }),
    enabled: q.trim() !== '',
  });

const LINK_HOSTS: Record<string, { source: ImportSource; pathPrefix?: string }> = {
  'worshiptogether.com': { source: 'worshiptogether', pathPrefix: '/songs/' },
  'tabs.ultimate-guitar.com': { source: 'ultimate-guitar', pathPrefix: '/tab/' },
  'pnwchords.com': { source: 'pnwchords' },
};

// Recognises a pasted search term as a direct chord-site link instead of a title to search for.
export const detectImportLink = (text: string): ImportSource | null => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const match = LINK_HOSTS[url.hostname.replace(/^www\./, '')];
  if (!match) return null;
  if (match.pathPrefix && !url.pathname.startsWith(match.pathPrefix)) return null;
  return match.source;
};

const importedChartSchema = z.object({
  source: z.enum([...IMPORT_SOURCES, 'text']),
  url: z.string().nullable(),
  title: z.string(),
  artist: z.string(),
  originalKey: z.string().nullable(),
  bpm: z.number().nullable(),
  chordLyrics: z.string(),
});

export type ImportedChart = z.infer<typeof importedChartSchema>;

export const fetchImportedChart = (url: string): Promise<ImportedChart> =>
  apiRequest('/api/songs/import/fetch', importedChartSchema, { method: 'POST', body: { url } });

export const convertImportedChart = (text: string): Promise<ImportedChart> =>
  apiRequest('/api/songs/import/convert', importedChartSchema, { method: 'POST', body: { text } });

const importMetadataSchema = z.object({
  recordingKey: z.string().nullable(),
  bpm: z.number().nullable(),
  tempo: z.enum(TEMPO_OPTIONS).nullable(),
  timeSignature: z.string().nullable(),
  year: z.string().nullable(),
});

export const importMetadataQueryOptions = (title: string, artist: string) =>
  queryOptions({
    queryKey: ['song-import', 'metadata', { title, artist }],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/import/metadata', importMetadataSchema, {
        query: { title, artist },
        signal,
      }),
    enabled: title.trim() !== '' && artist.trim() !== '',
    staleTime: Infinity,
    retry: false,
  });

export type NewSongInput = {
  title: string;
  artist: string;
  originalKey: string;
  chordLyrics: string;
  tempo: string[];
  timeSignature: string[];
  year: string | null;
  recommendedKeys: string[];
  themes: string[];
};

const createdSongSchema = z.object({ _id: z.string(), urlKey: z.string(), title: z.string() });

export const createSong = (input: NewSongInput): Promise<z.infer<typeof createdSongSchema>> =>
  apiRequest('/api/songs/create', createdSongSchema, { method: 'POST', body: input });
