import { parseArgs } from 'node:util';

import { DrizzleQueryError, asc, eq, sql } from 'drizzle-orm';

import { closeDatabase, getDb } from '../src/db/connect';
import { songs } from '../src/db/schema';
import { deriveSongThemes, isSongTheme, mergeThemes } from '../src/utils/songThemes';

class UsageError extends Error {}

const { values: args } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    'database-url': { type: 'string' },
  },
});

type Update = { id: string; title: string; themes: string[]; added: string[]; dropped: string[] };

const canonicalTheme = (value: string): string => value.replace(/\s+/gu, ' ').trim();

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const main = async (): Promise<void> => {
  const databaseUrl = args['database-url'] ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new UsageError('Usage: pnpm backfill:themes [--apply] [--database-url <url>]');
  }
  process.env.DATABASE_URL = databaseUrl;

  const rows = await getDb()
    .select({
      id: songs.id,
      title: songs.title,
      chordLyrics: songs.chordLyrics,
      themes: songs.themes,
    })
    .from(songs)
    .where(eq(songs.isDeleted, false))
    .orderBy(asc(songs.id));

  const droppedValues = new Map<string, number>();
  const updates: Update[] = [];
  let repaired = 0;
  let untagged = 0;
  for (const row of rows) {
    const stored = row.themes.map(canonicalTheme);
    repaired += stored.filter((theme, index) => theme !== row.themes[index]).length;
    const dropped = stored.filter((theme) => !isSongTheme(theme));
    for (const theme of dropped) droppedValues.set(theme, (droppedValues.get(theme) ?? 0) + 1);
    const kept = stored.filter(isSongTheme);
    const themes = mergeThemes(kept, deriveSongThemes(row.title, row.chordLyrics));
    if (themes.length === 0) untagged += 1;
    if (sameList(themes, row.themes)) continue;
    const added = themes.filter((theme) => !stored.includes(theme));
    updates.push({ id: row.id, title: row.title, themes, added, dropped });
  }

  console.log(`live songs: ${rows.length}`);
  console.log(`${args.apply ? 'updating' : 'would update'}: ${updates.length}`);
  console.log(`themes added: ${updates.reduce((total, { added }) => total + added.length, 0)}`);
  console.log(`stored themes with whitespace repaired: ${repaired}`);
  console.log(`stored themes outside the list (dropped): ${droppedValues.size}`);
  for (const [theme, count] of droppedValues) console.log(`  ${JSON.stringify(theme)} ×${count}`);
  console.log(`still without a theme: ${untagged}`);
  for (const { id, title, added, dropped } of updates) {
    const changes = [
      ...(added.length > 0 ? [`+${added.join(', ')}`] : []),
      ...(dropped.length > 0 ? [`−${dropped.join(', ')}`] : []),
    ];
    console.log(`  ${id} ${title}: ${changes.join(' ') || 'whitespace only'}`);
  }

  if (!args.apply) {
    console.log('dry run: pass --apply to write');
    return;
  }

  await getDb().transaction(async (tx) => {
    for (const { id, themes } of updates) {
      await tx
        .update(songs)
        .set({ themes, updatedAt: sql`now()` })
        .where(eq(songs.id, id));
    }
  });
  console.log(`updated: ${updates.length}`);
};

main()
  .catch((error: unknown) => {
    if (error instanceof UsageError) console.error(error.message);
    else {
      const cause = error instanceof DrizzleQueryError ? error.cause : error;
      console.error(
        cause instanceof Error
          ? `Backfill failed: ${cause.name}: ${cause.message}`
          : 'Backfill failed'
      );
    }
    process.exitCode = 1;
  })
  .finally(closeDatabase);
