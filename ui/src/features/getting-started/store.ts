import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { isTrackedStep, type TrackedStep } from './steps';

const STORAGE_KEY = 'getting-started';

export type StoredGettingStarted = {
  done: TrackedStep[];
  dismissed: boolean;
  finished: boolean;
};

const EMPTY: StoredGettingStarted = { done: [], dismissed: false, finished: false };

const storedUsersSchema = z.record(z.string(), z.unknown());
const storedUserSchema = z.object({
  done: z.array(z.unknown()).catch([]),
  dismissed: z.boolean().catch(false),
  finished: z.boolean().catch(false),
});

const listeners = new Set<() => void>();
// Blocked storage: progress still holds for this visit.
let unsavedRaw = '';

const readRaw = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return unsavedRaw;
  }
};

const parseUsers = (raw: string): Record<string, unknown> => {
  try {
    const stored = storedUsersSchema.safeParse(JSON.parse(raw));
    return stored.success ? stored.data : {};
  } catch {
    return {};
  }
};

const toStored = (value: unknown): StoredGettingStarted => {
  const stored = storedUserSchema.safeParse(value);
  if (!stored.success) return EMPTY;
  return {
    done: [...new Set(stored.data.done.filter(isTrackedStep))],
    dismissed: stored.data.dismissed,
    finished: stored.data.finished,
  };
};

export const readGettingStarted = (userId: string): StoredGettingStarted =>
  toStored(parseUsers(readRaw())[userId]);

const update = (
  userId: string,
  change: (current: StoredGettingStarted) => StoredGettingStarted
): void => {
  const users = parseUsers(readRaw());
  const current = toStored(users[userId]);
  const next = change(current);
  if (next === current) return;
  const raw = JSON.stringify({ ...users, [userId]: next });
  unsavedRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Kept in `unsavedRaw` instead.
  }
  for (const listener of listeners) listener();
};

export const markStepDone = (userId: string, step: TrackedStep): void =>
  update(userId, (current) =>
    current.done.includes(step) ? current : { ...current, done: [...current.done, step] }
  );

export const setGettingStartedDismissed = (userId: string, dismissed: boolean): void =>
  update(userId, (current) =>
    current.dismissed === dismissed ? current : { ...current, dismissed }
  );

export const finishGettingStarted = (userId: string): void =>
  update(userId, (current) => (current.finished ? current : { ...current, finished: true }));

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

export const useStoredGettingStarted = (userId: string): StoredGettingStarted => {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '');
  return toStored(parseUsers(raw)[userId]);
};
