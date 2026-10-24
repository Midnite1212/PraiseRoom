import { useSyncExternalStore } from 'react';
import { z } from 'zod';

const savedOrderSchema = z.array(z.string());

const storageKey = (setlistId: string) => `setlist-order:${setlistId}`;

// Keeps the saved ids that are still in the setlist, in the saved order, then appends songs the saved order lacks.
export const reconcileOrder = (saved: readonly string[], ids: readonly string[]): string[] => {
  const remaining = new Map<string, number>();
  for (const id of ids) remaining.set(id, (remaining.get(id) ?? 0) + 1);
  const order: string[] = [];
  for (const id of saved) {
    const left = remaining.get(id) ?? 0;
    if (left === 0) continue;
    remaining.set(id, left - 1);
    order.push(id);
  }
  for (const id of ids) {
    const left = remaining.get(id) ?? 0;
    if (left === 0) continue;
    remaining.set(id, left - 1);
    order.push(id);
  }
  return order;
};

export const isSameOrder = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index]);

export const parseSavedOrder = (raw: string | null): string[] => {
  if (raw === null) return [];
  try {
    const parsed = savedOrderSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};

const listeners = new Set<() => void>();

const readRaw = (setlistId: string): string | null => {
  try {
    return localStorage.getItem(storageKey(setlistId));
  } catch {
    return null;
  }
};

const writeRaw = (setlistId: string, raw: string | null) => {
  try {
    if (raw === null) localStorage.removeItem(storageKey(setlistId));
    else localStorage.setItem(storageKey(setlistId), raw);
  } catch {
    // Blocked storage: the order is not kept past this visit.
  }
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

// The order this device keeps for a setlist's songs (saved per setlist, reconciled with its current songs).
export function useLocalOrder(setlistId: string, ids: readonly string[]) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(setlistId),
    () => null
  );
  const order = reconcileOrder(parseSavedOrder(raw), ids);
  const isCustom = !isSameOrder(order, ids);

  const setOrder = (next: readonly string[]) =>
    writeRaw(setlistId, isSameOrder(next, ids) ? null : JSON.stringify(next));
  const reset = () => writeRaw(setlistId, null);

  return { order, isCustom, setOrder, reset };
}
