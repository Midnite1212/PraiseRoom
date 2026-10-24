import {
  SQL,
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';

import { PublicSongRecord, SongRecord, SongViewRecord } from '../../types/song.types';
import {
  InvalidInputError,
  castOptionalInteger,
  castOptionalString,
  castRequiredString,
  castStringArray,
  has,
} from '../cast';
import { getDb } from '../connect';
import { generateObjectId, toObjectId } from '../objectId';
import { MUSIC_KEYS, songs } from '../schema';
import { presentFields } from './shared';

export const SONG_FIELDS = [
  'title',
  'artist',
  'themes',
  'tempo',
  'year',
  'capo',
  'code',
  'timeSignature',
  'simplifiedChordLyrics',
  'originalKey',
  'recommendedKeys',
  'chordLyrics',
] as const;

export type SongField = (typeof SONG_FIELDS)[number];
export type SongFields = Partial<Record<SongField, unknown>>;
export type SongSortField = 'title' | 'code' | 'key' | 'tempo' | 'recent';

export type SongSearch = {
  keyword: string;
  code: string;
  tempo: string[];
  themes: string[];
  keys: string[];
  sortBy: SongSortField;
  descending: boolean;
  offset: number;
  limit: number;
};

type SongRow = typeof songs.$inferSelect;
export type SongValues = Partial<Omit<typeof songs.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>;

const REQUIRED_STRING_FIELDS = ['title', 'originalKey', 'artist', 'chordLyrics'] as const;
const OPTIONAL_STRING_FIELDS = ['year', 'code', 'simplifiedChordLyrics'] as const;
const STRING_ARRAY_FIELDS = ['tempo', 'recommendedKeys', 'timeSignature'] as const;
const MAX_CAPO = 11;

const toSongViewRecord = (row: SongRow): SongViewRecord => ({
  _id: row.id,
  title: row.title,
  tempo: row.tempo,
  originalKey: row.originalKey,
  themes: row.themes,
  artist: row.artist,
  ...presentFields({ year: row.year, code: row.code }),
  ...(row.capo === null ? {} : { capo: row.capo }),
  timeSignature: row.timeSignature,
  isVerified: row.isVerified,
  ...presentFields({ simplifiedChordLyrics: row.simplifiedChordLyrics }),
  isDeleted: row.isDeleted,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const toPublicSongRecord = (row: SongRow): PublicSongRecord => ({
  ...toSongViewRecord(row),
  recommendedKeys: row.recommendedKeys,
  chordLyrics: row.chordLyrics,
});

export const toSongRecord = (row: SongRow): SongRecord => ({
  ...toPublicSongRecord(row),
  ...presentFields({ createdBy: row.createdBy, lastUpdatedBy: row.lastUpdatedBy }),
});

export const toSongValues = (fields: SongFields): SongValues => {
  const values: SongValues = {};
  for (const field of REQUIRED_STRING_FIELDS) {
    if (has(fields, field)) values[field] = castRequiredString(field, fields[field]);
  }
  for (const field of OPTIONAL_STRING_FIELDS) {
    if (has(fields, field)) values[field] = castOptionalString(field, fields[field]);
  }
  for (const field of STRING_ARRAY_FIELDS) {
    if (has(fields, field)) values[field] = castStringArray(field, fields[field]);
  }
  if (has(fields, 'themes')) {
    values.themes = castStringArray('themes', fields.themes, { itemsRequired: true });
  }
  // Capo 0 means no capo, so it is stored as null like an empty value.
  if (has(fields, 'capo'))
    values.capo = castOptionalInteger('capo', fields.capo, { min: 0, max: MAX_CAPO }) || null;
  return values;
};

const escapeLikePattern = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

export const containsPattern = (value: string): string => `%${escapeLikePattern(value)}%`;

const isLiveSong = (id: string): SQL | undefined =>
  and(eq(songs.id, toObjectId(id)), eq(songs.isDeleted, false));

const searchCondition = ({ keyword, code, tempo, themes, keys }: SongSearch): SQL | undefined => {
  const conditions: (SQL | undefined)[] = [eq(songs.isDeleted, false)];
  const textMatches: SQL[] = [];
  if (keyword) textMatches.push(ilike(songs.title, containsPattern(keyword)));
  if (code) textMatches.push(ilike(songs.code, containsPattern(code)));
  if (textMatches.length > 0) conditions.push(or(...textMatches));
  if (tempo.length > 0) conditions.push(arrayOverlaps(songs.tempo, tempo));
  if (themes.length > 0) conditions.push(arrayOverlaps(songs.themes, themes));
  if (keys.length > 0) conditions.push(inArray(songs.originalKey, keys));
  return and(...conditions);
};

const KEY_ROOTS: Readonly<Record<string, number>> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

// Chromatic from C, each major key just before its minor; an unrecognised key sorts last.
const keyRank = (): SQL => {
  const branches = MUSIC_KEYS.map((key) => {
    const isMinor = key.endsWith('m');
    const root = KEY_ROOTS[isMinor ? key.slice(0, -1) : key] ?? 0;
    return sql`when ${key} then ${sql.raw(String(root * 2 + (isMinor ? 1 : 0)))}`;
  });
  return sql`case ${songs.originalKey} ${sql.join(branches, sql` `)} else ${sql.raw(String(MUSIC_KEYS.length * 2))} end`;
};

// A song lists every tempo it suits; it sorts by the fastest, and by 0 when it has none.
const tempoRank = (): SQL =>
  sql`coalesce((select max(case t when 'Slow' then 1 when 'Medium Slow' then 2 when 'Medium' then 3 when 'Fast' then 4 else 0 end) from unnest(${songs.tempo}) as t), 0)`;

const searchOrder = ({ sortBy, descending }: SongSearch): SQL[] => {
  const direction = (expression: SQL): SQL =>
    descending ? sql`${expression} desc` : sql`${expression} asc`;
  const byTitle = sql`${songs.title} collate "C" asc`;
  switch (sortBy) {
    case 'recent':
      return [desc(songs.createdAt), desc(songs.id)];
    case 'code':
      return [
        descending
          ? sql`${songs.code} collate "C" desc nulls last`
          : sql`${songs.code} collate "C" asc nulls first`,
        asc(songs.id),
      ];
    case 'key':
      return [direction(keyRank()), asc(songs.originalKey), byTitle, asc(songs.id)];
    case 'tempo':
      return [direction(tempoRank()), byTitle, asc(songs.id)];
    default:
      return [descending ? sql`${songs.title} collate "C" desc` : byTitle, asc(songs.id)];
  }
};

export const songRepository = {
  async create(fields: SongFields): Promise<SongRecord> {
    const values = toSongValues(fields);
    const { title, originalKey, artist, chordLyrics } = values;
    if (!title || !originalKey || !artist || !chordLyrics) {
      throw new InvalidInputError('song');
    }
    const now = new Date();
    const [row] = await getDb()
      .insert(songs)
      .values({
        ...values,
        title,
        originalKey,
        artist,
        chordLyrics,
        id: generateObjectId(now),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toSongRecord(row);
  },

  async findLiveById(id: string): Promise<SongRecord | null> {
    const [row] = await getDb().select().from(songs).where(isLiveSong(id));
    return row ? toSongRecord(row) : null;
  },

  async listLive(): Promise<SongRecord[]> {
    const rows = await getDb()
      .select()
      .from(songs)
      .where(eq(songs.isDeleted, false))
      .orderBy(asc(songs.id));
    return rows.map(toSongRecord);
  },

  async listLiveView(): Promise<SongViewRecord[]> {
    const rows = await getDb()
      .select()
      .from(songs)
      .where(eq(songs.isDeleted, false))
      .orderBy(asc(songs.id));
    return rows.map(toSongViewRecord);
  },

  async search(search: SongSearch): Promise<{ songs: SongRecord[]; totalCount: number }> {
    const where = searchCondition(search);
    const db = getDb();
    const rows = await db
      .select()
      .from(songs)
      .where(where)
      .orderBy(...searchOrder(search))
      .offset(search.offset)
      .limit(search.limit);
    const [{ totalCount }] = await db.select({ totalCount: count() }).from(songs).where(where);
    return { songs: rows.map(toSongRecord), totalCount };
  },

  async listOriginalKeys(): Promise<string[]> {
    const rows = await getDb()
      .selectDistinct({ originalKey: songs.originalKey })
      .from(songs)
      .where(eq(songs.isDeleted, false))
      .orderBy(asc(songs.originalKey));
    return rows.map((row) => row.originalKey);
  },

  async updateLive(id: string, fields: SongFields): Promise<SongRecord | null> {
    const [row] = await getDb()
      .update(songs)
      .set({ ...toSongValues(fields), updatedAt: new Date() })
      .where(isLiveSong(id))
      .returning();
    return row ? toSongRecord(row) : null;
  },

  async softDelete(id: string): Promise<boolean> {
    const rows = await getDb()
      .update(songs)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(isLiveSong(id))
      .returning({ id: songs.id });
    return rows.length > 0;
  },
};
