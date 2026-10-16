import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { DrizzleQueryError } from 'drizzle-orm';

import { closeDatabase } from '../src/db/connect';
import { countExistingSongs, insertSongs, mapSongDocuments } from '../src/db/importSongs';

class ImportUsageError extends Error {}

const readDocuments = (file: string): unknown => {
  const text = readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new ImportUsageError(`Import failed: ${file} is not valid JSON`);
  }
};

const { values: args } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    'database-url': { type: 'string' },
    file: { type: 'string' },
  },
});

const main = async (): Promise<void> => {
  if (!args.file)
    throw new ImportUsageError('Usage: pnpm import:songs --file <songs.json> [--apply]');
  const documents = readDocuments(args.file);
  if (!Array.isArray(documents))
    throw new ImportUsageError('Expected a mongoexport --jsonArray file');

  const { rows, skipped } = mapSongDocuments(documents);
  console.log(`read: ${documents.length}`);
  console.log(`valid: ${rows.length}`);
  console.log(`skipped: ${skipped.length}`);
  for (const { index, id, reason } of skipped) {
    console.log(`  #${index} ${id ?? '(no valid _id)'}: ${reason}`);
  }

  const databaseUrl = args['database-url'] ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (args.apply) throw new ImportUsageError('Pass --database-url or set DATABASE_URL');
    console.log(`would insert: ${rows.length} (database not checked)`);
    return;
  }
  process.env.DATABASE_URL = databaseUrl;

  if (!args.apply) {
    const present = await countExistingSongs(rows.map((row) => row.id));
    console.log(`already present: ${present}`);
    console.log(`would insert: ${rows.length - present}`);
    console.log('dry run: pass --apply to write');
    return;
  }
  const inserted = await insertSongs(rows);
  console.log(`inserted: ${inserted}`);
  console.log(`already present: ${rows.length - inserted}`);
};

main()
  .catch((error: unknown) => {
    if (error instanceof ImportUsageError) {
      console.error(error.message);
    } else {
      const cause = error instanceof DrizzleQueryError ? error.cause : error;
      console.error(cause instanceof Error ? `Import failed: ${cause.name}` : 'Import failed');
    }
    process.exitCode = 1;
  })
  .finally(closeDatabase);
