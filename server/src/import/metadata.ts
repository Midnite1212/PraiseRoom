import { decodeEntities } from './chart';
import { UpstreamError, fetchPage } from './fetchPage';
import { normalizeKey } from './theory';

export type SongMetadata = {
  recordingKey: string | null;
  bpm: number | null;
  tempo: string | null;
  timeSignature: string | null;
  year: string | null;
  sources: string[];
};

export type TempoBand = 'Fast' | 'Medium' | 'Medium Slow' | 'Slow';

export const tempoBand = (bpm: number): TempoBand =>
  bpm >= 106 ? 'Fast' : bpm >= 86 ? 'Medium' : bpm >= 71 ? 'Medium Slow' : 'Slow';

const words = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slug = (text: string): string => words(text).replace(/\s+/g, '-');

const artistKey = (text: string): string =>
  words(text)
    .replace(/\b(feat|ft|featuring)\b.*$/, '')
    .replace(/\b(the|music|worship|band|live)\b/g, '')
    .replace(/\s+/g, '');

export const artistsMatch = (a: string, b: string): boolean => {
  const x = artistKey(a);
  const y = artistKey(b);
  return x.length > 2 && y.length > 2 && (x === y || x.includes(y) || y.includes(x));
};

export const parseSongBpmPage = (html: string) => {
  const text = decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const bpm = /tempo of (\d+) BPM/i.exec(text)?.[1] ?? /(\d+)\s*BPM/.exec(text)?.[1];
  const key = /with an? ([A-G][#♯b♭]?)(?:\/[A-G][#♯b♭]?)? key and an? (major|minor) mode/i.exec(
    text
  );
  const beats = Number(/time signature of (\d+) beats per bar/i.exec(text)?.[1]);
  return {
    bpm: bpm ? Number(bpm) : null,
    recordingKey: key ? normalizeKey(`${key[1] ?? ''}${key[2] === 'minor' ? 'm' : ''}`) : null,
    timeSignature: beats === 3 ? '3/4' : beats === 4 ? '4/4' : null,
  };
};

// songbpm song slugs are the title plus a short id or a UUID.
const SONGBPM_ID_SUFFIX = /^-(?:[a-z0-9]{4,6}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;

export const findSongBpmLink = (html: string, title: string, artist: string): string | null => {
  const wanted = slug(title);
  for (const match of html.matchAll(/href="(\/@([^"/]+)\/([^"/]+))"/g)) {
    const [, path = '', artistSlug = '', titleSlug = ''] = match;
    const suffix = titleSlug.startsWith(wanted) ? titleSlug.slice(wanted.length) : null;
    if (
      artistsMatch(artistSlug.replace(/-/g, ' '), artist) &&
      suffix !== null &&
      (suffix === '' || SONGBPM_ID_SUFFIX.test(suffix))
    ) {
      return `https://songbpm.com${path}`;
    }
  }
  return null;
};

const songBpm = async (title: string, artist: string) => {
  const direct = `https://songbpm.com/@${slug(artist)}/${slug(title)}`;
  try {
    return parseSongBpmPage((await fetchPage(direct)).body);
  } catch (error: unknown) {
    if (!(error instanceof UpstreamError) || error.kind !== 'not-found') throw error;
  }
  const search = await fetchPage('https://songbpm.com/searches', {
    method: 'POST',
    form: `query=${encodeURIComponent(`${artist} ${title}`)}`,
    timeoutMs: 45_000,
  });
  if (!search.location) return null;
  const results = await fetchPage(new URL(search.location, 'https://songbpm.com').href);
  const link = findSongBpmLink(results.body, title, artist);
  return link ? parseSongBpmPage((await fetchPage(link)).body) : null;
};

export const earliestItunesYear = (json: string, title: string, artist: string): string | null => {
  let results: unknown;
  try {
    results = (JSON.parse(json) as { results?: unknown }).results;
  } catch {
    return null;
  }
  if (!Array.isArray(results)) return null;
  const years = results
    .filter(
      (result): result is { trackName: string; artistName: string; releaseDate: string } =>
        typeof result === 'object' &&
        result !== null &&
        typeof (result as { trackName?: unknown }).trackName === 'string' &&
        typeof (result as { artistName?: unknown }).artistName === 'string' &&
        typeof (result as { releaseDate?: unknown }).releaseDate === 'string'
    )
    .filter(
      (result) =>
        words(result.trackName).replace(/\s+/g, '') === words(title).replace(/\s+/g, '') &&
        artistsMatch(result.artistName, artist)
    )
    .map((result) => result.releaseDate.slice(0, 4))
    .filter((year) => /^\d{4}$/.test(year))
    .sort();
  return years[0] ?? null;
};

const itunesYear = async (title: string, artist: string): Promise<string | null> => {
  const term = encodeURIComponent(`${title} ${artist}`);
  const { body } = await fetchPage(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=50&country=US`
  );
  return earliestItunesYear(body, title, artist);
};

const LOOKUP_DEADLINE_MS = 55_000;

const withDeadline = <T>(work: Promise<T>): Promise<T> =>
  Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new UpstreamError('unavailable', 'Lookup timed out')),
        LOOKUP_DEADLINE_MS
      ).unref();
    }),
  ]);

// Each source is optional: a failing or slow lookup leaves its fields null instead of failing the whole request.
export const lookupMetadata = async (title: string, artist: string): Promise<SongMetadata> => {
  const [bpmResult, yearResult] = await Promise.allSettled([
    withDeadline(songBpm(title, artist)),
    withDeadline(itunesYear(title, artist)),
  ]);
  const bpmInfo = bpmResult.status === 'fulfilled' ? bpmResult.value : null;
  const year = yearResult.status === 'fulfilled' ? yearResult.value : null;
  return {
    recordingKey: bpmInfo?.recordingKey ?? null,
    bpm: bpmInfo?.bpm ?? null,
    tempo: bpmInfo?.bpm ? tempoBand(bpmInfo.bpm) : null,
    timeSignature: bpmInfo?.timeSignature ?? null,
    year,
    sources: [...(bpmInfo ? ['songbpm'] : []), ...(year ? ['itunes'] : [])],
  };
};
