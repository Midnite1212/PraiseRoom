import { useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saving' | 'saved' | 'error' | 'paused';

type AutosaveOptions<T> = {
  value: T;
  // Sends the value to the server; wire it to a mutation's `mutateAsync`.
  save: (value: T) => Promise<unknown>;
  delayMs?: number;
  // False holds saving back while the draft is not valid yet.
  enabled?: boolean;
  isEqual?: (a: T, b: T) => boolean;
  onError?: (error: unknown) => void;
};

type Phase<T> = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; failed: T };

// Saves `value` after it has been still for `delayMs`, one request at a time, and reports where it stands.
// The value on mount counts as saved. `flush` saves what is pending and resolves false if that fails (use it
// before leaving the page); pending edits are also flushed when the editor unmounts.
export function useAutosave<T>({
  value,
  save,
  delayMs = 800,
  enabled = true,
  isEqual = Object.is,
  onError,
}: AutosaveOptions<T>) {
  const [state, setState] = useState<{ saved: T; phase: Phase<T> }>({
    saved: value,
    phase: { kind: 'idle' },
  });
  const latest = useRef({ value, enabled, save, onError, isEqual });
  const savedRef = useRef(value);
  const inFlight = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    latest.current = { value, enabled, save, onError, isEqual };
  });

  const runSave = (sent: T) => {
    setState((current) => ({ ...current, phase: { kind: 'saving' } }));
    const request = (async () => {
      try {
        await latest.current.save(sent);
        savedRef.current = sent;
        setState({ saved: sent, phase: { kind: 'idle' } });
        return true;
      } catch (error: unknown) {
        setState((current) => ({ ...current, phase: { kind: 'error', failed: sent } }));
        latest.current.onError?.(error);
        return false;
      }
    })();
    inFlight.current = request;
    return request;
  };

  const flush = async (): Promise<boolean> => {
    await inFlight.current;
    const { value: current, isEqual: equal } = latest.current;
    if (equal(current, savedRef.current)) return true;
    return (await runSave(current)) ? flush() : false;
  };

  const actions = useRef({ runSave, flush });
  useEffect(() => {
    actions.current = { runSave, flush };
  });
  useEffect(
    () => () => {
      if (latest.current.enabled) void actions.current.flush();
    },
    []
  );

  const dirty = !isEqual(value, state.saved);
  const failedAlready = state.phase.kind === 'error' && isEqual(value, state.phase.failed);

  useEffect(() => {
    if (!enabled || !dirty || failedAlready || state.phase.kind === 'saving') return undefined;
    const timer = window.setTimeout(() => void actions.current.runSave(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [enabled, dirty, failedAlready, state.phase.kind, value, delayMs]);

  const status: SaveStatus = failedAlready
    ? 'error'
    : dirty && !enabled
      ? 'paused'
      : dirty || state.phase.kind === 'saving'
        ? 'saving'
        : 'saved';

  return { status, flush, retry: () => void runSave(latest.current.value) };
}
