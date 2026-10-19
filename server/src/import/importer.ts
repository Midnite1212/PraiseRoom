import { cleanChart, toChordLyrics } from './chart';
import { UpstreamError, isAllowedUrl } from './fetchPage';
import { lookupMetadata } from './metadata';
import {
  type Candidate,
  SOURCES,
  type SourceId,
  fetchSourceChart,
  searchSource,
  sourceOf,
} from './sources';
import { diatonicFit, inferKey, semitonesBetween, transposeChart } from './theory';

export type ImportedChart = {
  source: SourceId | 'text';
  url: string | null;
  title: string;
  artist: string;
  originalKey: string | null;
  bpm: number | null;
  chordLyrics: string;
};

export type SearchResult = { candidates: Candidate[]; unavailable: SourceId[] };

export const searchCharts = async (query: string): Promise<SearchResult> => {
  const settled = await Promise.allSettled(SOURCES.map((source) => searchSource(source, query)));
  const candidates: Candidate[] = [];
  const unavailable: SourceId[] = [];
  settled.forEach((result, index) => {
    const source = SOURCES[index];
    if (!source) return;
    if (result.status === 'fulfilled') candidates.push(...result.value);
    else unavailable.push(source);
  });
  return { candidates, unavailable };
};

export const isImportableUrl = (url: string): boolean =>
  isAllowedUrl(url) && sourceOf(url) !== null;

// Charts are sometimes written in a different key from the recording (WorshipTogether labels Not To Us B but
// charts it in A), so a chart moves to the source's recording key only when its chords fit that key clearly worse.
const KEY_FIT_MARGIN = 0.1;

const finishChart = (chart: string, recordingKey: string | null) => {
  const cleaned = cleanChart(chart);
  const inferred = inferKey(cleaned);
  if (recordingKey && inferred) {
    const semitones = semitonesBetween(inferred.key, recordingKey);
    const misplaced =
      semitones !== 0 &&
      diatonicFit(cleaned, recordingKey) + KEY_FIT_MARGIN < diatonicFit(cleaned, inferred.key);
    return {
      chordLyrics: misplaced ? transposeChart(cleaned, semitones, recordingKey) : cleaned,
      originalKey: recordingKey,
    };
  }
  return { chordLyrics: cleaned, originalKey: recordingKey ?? inferred?.key ?? null };
};

export const importFromUrl = async (url: string): Promise<ImportedChart> => {
  const source = sourceOf(url);
  if (!source || !isAllowedUrl(url)) throw new UpstreamError('blocked', 'Unsupported link');
  const chart = await fetchSourceChart(source, url);
  if (!chart || !/\[[A-G]/.test(chart.chordLyrics)) {
    throw new UpstreamError('not-found', 'No chord chart on the page');
  }
  return {
    source,
    url: chart.url,
    title: chart.title,
    artist: chart.artist,
    bpm: chart.bpm,
    ...finishChart(chart.chordLyrics, chart.recordingKey),
  };
};

export const importFromText = (text: string): ImportedChart => ({
  source: 'text',
  url: null,
  title: '',
  artist: '',
  bpm: null,
  ...finishChart(toChordLyrics(text), null),
});

export { lookupMetadata };
