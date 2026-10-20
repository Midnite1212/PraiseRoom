import { useSyncExternalStore } from 'react';

export type StoredChoice<T extends string> = {
  read: () => T;
  write: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
  use: () => [T, (value: T) => void];
};

// A per-device preference kept in localStorage, shared by every component that reads it.
export const createStoredChoice = <const T extends string>(
  storageKey: string,
  values: readonly T[],
  fallback: T
): StoredChoice<T> => {
  const listeners = new Set<() => void>();
  const isValue = (value: unknown): value is T => values.some((option) => option === value);

  const read = (): T => {
    try {
      const stored = localStorage.getItem(storageKey);
      return isValue(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (value: T): void => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Blocked storage: the choice still applies for this visit through the listeners below.
    }
    for (const listener of listeners) listener();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  return {
    read,
    write,
    subscribe,
    use: () => [useSyncExternalStore(subscribe, read, () => fallback), write],
  };
};
