import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { MAX_CAPO } from './chord-display';

const STORAGE_KEY = 'song-capos';

const capoSchema = z.number().int().min(0).max(MAX_CAPO);
const storedCaposSchema = z.record(z.string(), z.unknown());

const listeners = new Set<() => void>();

const readRaw = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const parseCapos = (raw: string): Record<string, number> => {
  try {
    const stored = storedCaposSchema.safeParse(JSON.parse(raw));
    if (!stored.success) return {};
    const capos: Record<string, number> = {};
    for (const [songId, value] of Object.entries(stored.data)) {
      const capo = capoSchema.safeParse(value);
      if (capo.success) capos[songId] = capo.data;
    }
    return capos;
  } catch {
    return {};
  }
};

export const readSongCapo = (songId: string): number | null =>
  parseCapos(readRaw())[songId] ?? null;

// A null capo clears the stored choice so the song's saved capo applies again.
export const writeSongCapo = (songId: string, capo: number | null): void => {
  const capos = parseCapos(readRaw());
  if (capo === null) delete capos[songId];
  else capos[songId] = capoSchema.catch(0).parse(capo);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capos));
  } catch {
    // Blocked storage: the choice still applies for this visit through the listeners below.
  }
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

// The capo for one song on this device, defaulting to the song's saved capo.
export const useSongCapo = (
  songId: string,
  savedCapo: number | null | undefined
): [number, (capo: number | null) => void] => {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '');
  const saved = capoSchema.safeParse(savedCapo ?? 0);
  const capo = parseCapos(raw)[songId] ?? (saved.success ? saved.data : 0);
  return [capo, (next) => writeSongCapo(songId, next)];
};
