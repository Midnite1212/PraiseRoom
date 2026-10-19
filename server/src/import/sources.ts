import { decodeEntities, sectionLabel, tidy, toChordLyrics } from './chart';
import { UpstreamError, fetchPage } from './fetchPage';
import { inferKey, majorKeyName, minorKeyName, normalizeKey, transposeChart } from './theory';

export const SOURCES = ['worshiptogether', 'ultimate-guitar', 'pnwchords'] as const;
export type SourceId = (typeof SOURCES)[number];

export type Candidate = {
  source: SourceId;
  url: string;
  title: string;
  artist: string | null;
  votes: number | null;
};

export type SourceChart = {
  source: SourceId;
  url: string;
  title: string;
  artist: string;
  chordLyrics: string;
  recordingKey: string | null;
  bpm: number | null;
};

const MAX_CANDIDATES = 6;
const SEARCH_TIMEOUT_MS = 8_000;

const slugWords = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const titleCase = (words: string[]): string =>
  words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const stripTags = (html: string): string => decodeEntities(html.replace(/<[^>]+>/g, ''));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const at = (value: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), value);

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value) || 0;

// ---------- WorshipTogether ----------

const WT_SITEMAP = 'https://www.worshiptogether.com/sitemap-en.xml';
const WT_INDEX_TTL_MS = 6 * 60 * 60 * 1000;
const WT_FAILURE_TTL_MS = 5 * 60 * 1000;
let wtIndex: { urls: string[]; loadedAt: number } | null = null;
let wtLoading: Promise<string[]> | null = null;
let wtFailedAt = 0;

export const parseWorshipTogetherSitemap = (xml: string): string[] =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1] ?? '')
    .filter((url) => /^https:\/\/www\.worshiptogether\.com\/songs\/[a-z0-9-]+\/$/.test(url));

// One sitemap fetch per instance at a time; after a failure, searches skip WorshipTogether for a few minutes.
const worshipTogetherIndex = async (): Promise<string[]> => {
  if (wtIndex && Date.now() - wtIndex.loadedAt < WT_INDEX_TTL_MS) return wtIndex.urls;
  if (Date.now() - wtFailedAt < WT_FAILURE_TTL_MS)
    throw new UpstreamError('unavailable', 'Recently failed');
  wtLoading ??= fetchPage(WT_SITEMAP, { timeoutMs: SEARCH_TIMEOUT_MS })
    .then(({ body }) => {
      wtIndex = { urls: parseWorshipTogetherSitemap(body), loadedAt: Date.now() };
      return wtIndex.urls;
    })
    .catch((error: unknown) => {
      wtFailedAt = Date.now();
      throw error;
    })
    .finally(() => {
      wtLoading = null;
    });
  return wtLoading;
};

export const matchWorshipTogether = (urls: string[], query: string): Candidate[] => {
  const words = slugWords(query);
  if (!words.length) return [];
  return urls
    .map((url) => ({ url, slug: url.replace(/\/$/, '').split('/').pop() ?? '' }))
    .filter(({ slug }) => words.every((word) => slug.split('-').includes(word)))
    .sort((a, b) => a.slug.length - b.slug.length)
    .slice(0, MAX_CANDIDATES)
    .map(({ url, slug }) => ({
      source: 'worshiptogether',
      url,
      title: titleCase(slug.split('-')),
      artist: null,
      votes: null,
    }));
};

const wtMeta = (html: string, property: string): string =>
  decodeEntities(
    new RegExp(`property="cludo:${property}" content="([^"]*)"`).exec(html)?.[1] ?? ''
  ).trim();

const wtDetail = (html: string, label: string): string =>
  stripTags(
    new RegExp(`<span>${label}:</span>\\s*<p>([\\s\\S]*?)</p>`).exec(html)?.[1] ?? ''
  ).trim();

export const parseWorshipTogether = (html: string, url: string): SourceChart | null => {
  const lines: string[] = [];
  let hasChords = false;
  for (const block of html.split('<div class="chord-pro-line">').slice(1)) {
    const segments = [
      ...block.matchAll(
        /class="chord-pro-note">([^<]*)<\/div>\s*<div class="chord-pro-lyric">([^<]*)</g
      ),
    ].map((match) => ({
      chord: decodeEntities(match[1] ?? '').replace(/\s+/g, ''),
      lyric: decodeEntities(match[2] ?? ''),
    }));
    if (!segments.length) {
      lines.push('');
      continue;
    }
    const text = segments
      .map((segment) => segment.lyric)
      .join('')
      .trim();
    const label = segments.every((segment) => !segment.chord) ? sectionLabel(text) : null;
    if (label) {
      lines.push('', `{${label}}`);
      continue;
    }
    if (segments.some((segment) => segment.chord)) hasChords = true;
    lines.push(segments.map(({ chord, lyric }) => (chord ? `[${chord}]${lyric}` : lyric)).join(''));
  }
  if (!hasChords) return null;
  return {
    source: 'worshiptogether',
    url,
    title: wtMeta(html, 'englishSongTitle') || wtMeta(html, 'title'),
    artist: wtMeta(html, 'worshipLeader'),
    chordLyrics: tidy(lines.join('\n')),
    recordingKey: normalizeKey(wtMeta(html, 'originalKey') || wtDetail(html, 'Original Key')),
    bpm: Number(wtDetail(html, 'BPM')) || null,
  };
};

// ---------- Ultimate Guitar ----------

const UG_SEARCH = 'https://www.ultimate-guitar.com/search.php?search_type=title&value=';

const ugStore = (html: string): unknown => {
  const raw = /class="js-store" data-content="([^"]*)"/.exec(html)?.[1];
  if (!raw) return null;
  try {
    return JSON.parse(
      raw
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
    );
  } catch {
    return null;
  }
};

export const parseUltimateGuitarSearch = (html: string): Candidate[] => {
  const results = at(ugStore(html), 'store', 'page', 'data', 'results');
  if (!Array.isArray(results)) return [];
  return results
    .filter((result) => at(result, 'type') === 'Chords' && asString(at(result, 'tab_url')))
    .map((result) => ({
      score: asNumber(at(result, 'votes')) * asNumber(at(result, 'rating')),
      candidate: {
        source: 'ultimate-guitar' as const,
        url: asString(at(result, 'tab_url')),
        title: asString(at(result, 'song_name')),
        artist: asString(at(result, 'artist_name')) || null,
        votes: asNumber(at(result, 'votes')),
      },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map(({ candidate }) => candidate);
};

// UG wraps chords in [ch]…[/ch] inside [tab] blocks; removing the tags restores the chords-over-lyrics columns.
export const ultimateGuitarContentToText = (content: string): string =>
  decodeEntities(content)
    .replace(/\[\/?tab\]/g, '')
    .replace(/\[ch\]([^[]*)\[\/ch\]/g, '$1');

export const parseUltimateGuitar = (html: string, url: string): SourceChart | null => {
  const store = ugStore(html);
  const content = asString(at(store, 'store', 'page', 'data', 'tab_view', 'wiki_tab', 'content'));
  if (!content) return null;
  const capo = asNumber(at(store, 'store', 'page', 'data', 'tab_view', 'meta', 'capo'));
  const shapes = toChordLyrics(ultimateGuitarContentToText(content));
  return {
    source: 'ultimate-guitar',
    url,
    title: asString(at(store, 'store', 'page', 'data', 'tab', 'song_name')),
    artist: asString(at(store, 'store', 'page', 'data', 'tab', 'artist_name')),
    chordLyrics: capo ? transposeChart(shapes, capo, soundingKey(shapes, capo)) : shapes,
    recordingKey: null,
    bpm: null,
  };
};

// The key the capo'd shapes sound in, so transposed chords use that key's sharps or flats.
const soundingKey = (shapes: string, capo: number): string => {
  const shapeKey = inferKey(shapes)?.key;
  const shapeRoot = shapeKey ? normalizeKey(shapeKey.replace(/m$/, '')) : null;
  if (!shapeKey || !shapeRoot) return 'C';
  const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const root = roots.indexOf(shapeRoot) + capo;
  return shapeKey.endsWith('m') ? minorKeyName(root) : majorKeyName(root);
};

// ---------- PNW Chords ----------

const PNW_SEARCH = 'https://pnwchords.com/?s=';

const splitTitleArtist = (heading: string): { title: string; artist: string } => {
  const [title = heading, artist = ''] = heading.split(/\s+[–—-]\s+/);
  return { title: title.trim(), artist: artist.replace(/\s*\([^)]*\)\s*$/, '').trim() };
};

export const parsePnwSearch = (html: string): Candidate[] =>
  [
    ...html.matchAll(
      /<h2 class="post-title[^"]*"[^>]*>\s*<a href="(https:\/\/pnwchords\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
    ),
  ]
    .slice(0, MAX_CANDIDATES)
    .map((match) => {
      const { title, artist } = splitTitleArtist(stripTags(match[2] ?? ''));
      return {
        source: 'pnwchords',
        url: match[1] ?? '',
        title,
        artist: artist || null,
        votes: null,
      };
    });

export const parsePnw = (html: string, url: string): SourceChart | null => {
  const pre = /<pre[^>]*>([\s\S]*?)<\/pre>/.exec(html)?.[1];
  if (!pre) return null;
  const heading = stripTags(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? '');
  const { title, artist } = splitTitleArtist(heading);
  return {
    source: 'pnwchords',
    url,
    title,
    artist,
    chordLyrics: toChordLyrics(stripTags(pre.replace(/<br\s*\/?>/gi, '\n'))),
    recordingKey: null,
    bpm: null,
  };
};

// ---------- dispatch ----------

export const sourceOf = (url: string): SourceId | null => {
  const host = new URL(url).hostname;
  if (host.endsWith('worshiptogether.com')) return 'worshiptogether';
  if (host.endsWith('ultimate-guitar.com')) return 'ultimate-guitar';
  if (host.endsWith('pnwchords.com')) return 'pnwchords';
  return null;
};

export const searchSource = async (source: SourceId, query: string): Promise<Candidate[]> => {
  if (source === 'worshiptogether')
    return matchWorshipTogether(await worshipTogetherIndex(), query);
  if (source === 'ultimate-guitar') {
    return parseUltimateGuitarSearch(
      (await fetchPage(UG_SEARCH + encodeURIComponent(query), { timeoutMs: SEARCH_TIMEOUT_MS }))
        .body
    );
  }
  return parsePnwSearch(
    (await fetchPage(PNW_SEARCH + encodeURIComponent(query).replace(/%20/g, '+'))).body
  );
};

const PARSERS: Record<SourceId, (html: string, url: string) => SourceChart | null> = {
  worshiptogether: parseWorshipTogether,
  'ultimate-guitar': parseUltimateGuitar,
  pnwchords: parsePnw,
};

export const fetchSourceChart = async (
  source: SourceId,
  url: string
): Promise<SourceChart | null> => {
  const page = await fetchPage(url);
  return PARSERS[source](page.body, page.url);
};
