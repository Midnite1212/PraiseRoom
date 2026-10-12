import { inArray } from 'drizzle-orm';
import { pick } from '../utils/pick';
import { InvalidInputError } from './cast';
import { getDb } from './connect';
import { SONG_FIELDS, SongValues, toSongValues } from './repositories/song.repository';
import { songs } from './schema';

export type SongRow = typeof songs.$inferInsert;
export type SkippedSong = { index: number; id: string | null; reason: string };
export type MappedSongs = { rows: SongRow[]; skipped: SkippedSong[] };

type ExtendedJson = Record<string, unknown>;

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const INSERT_BATCH_SIZE = 500;

const isRecord = (value: unknown): value is ExtendedJson =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseObjectId = (value: unknown): string | null => {
  const hex = isRecord(value) ? value.$oid : value;
  return typeof hex === 'string' && OBJECT_ID.test(hex) ? hex.toLowerCase() : null;
};

export const parseDate = (value: unknown): Date | null => {
  const raw = isRecord(value) ? value.$date : value;
  const instant = isRecord(raw) ? Number(raw.$numberLong) : raw;
  if (typeof instant !== 'string' && typeof instant !== 'number') return null;
  const date = new Date(instant);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const objectIdDate = (id: string): Date => new Date(parseInt(id.slice(0, 8), 16) * 1000);

const requireField = (
  values: SongValues,
  field: 'title' | 'artist' | 'originalKey' | 'chordLyrics'
): string => {
  const value = values[field];
  if (!value) throw new InvalidInputError(field);
  return value;
};

export const toSongRow = (document: unknown): SongRow => {
  if (!isRecord(document)) throw new InvalidInputError('document');
  const id = parseObjectId(document._id);
  if (!id) throw new InvalidInputError('_id');
  const values = toSongValues(pick(document, SONG_FIELDS));
  const createdAt = parseDate(document.createdAt) ?? objectIdDate(id);
  return {
    id,
    title: requireField(values, 'title'),
    artist: requireField(values, 'artist'),
    originalKey: requireField(values, 'originalKey'),
    chordLyrics: requireField(values, 'chordLyrics'),
    tempo: values.tempo ?? [],
    recommendedKeys: values.recommendedKeys ?? [],
    themes: values.themes ?? [],
    timeSignature: values.timeSignature ?? [],
    year: values.year ?? null,
    code: values.code ?? null,
    simplifiedChordLyrics: values.simplifiedChordLyrics ?? null,
    createdBy: parseObjectId(document.createdBy),
    lastUpdatedBy: parseObjectId(document.lastUpdatedBy),
    isVerified: document.isVerified === true,
    isDeleted: document.isDeleted === true,
    createdAt,
    updatedAt: parseDate(document.updatedAt) ?? createdAt,
  };
};

export const mapSongDocuments = (documents: unknown[]): MappedSongs => {
  const rows: SongRow[] = [];
  const skipped: SkippedSong[] = [];
  const seen = new Set<string>();
  documents.forEach((document, index) => {
    const id = isRecord(document) ? parseObjectId(document._id) : null;
    try {
      const row = toSongRow(document);
      if (seen.has(row.id)) {
        skipped.push({ index, id, reason: 'duplicate id' });
        return;
      }
      seen.add(row.id);
      rows.push(row);
    } catch (error: unknown) {
      if (!(error instanceof InvalidInputError)) throw error;
      skipped.push({ index, id, reason: `invalid ${error.path}` });
    }
  });
  return { rows, skipped };
};

export const countExistingSongs = async (ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;
  const rows = await getDb().select({ id: songs.id }).from(songs).where(inArray(songs.id, ids));
  return rows.length;
};

export const insertSongs = (rows: SongRow[]): Promise<number> =>
  getDb().transaction(async (tx) => {
    let inserted = 0;
    for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
      const batch = rows.slice(start, start + INSERT_BATCH_SIZE);
      const result = await tx
        .insert(songs)
        .values(batch)
        .onConflictDoNothing({ target: songs.id })
        .returning({ id: songs.id });
      inserted += result.length;
    }
    return inserted;
  });
