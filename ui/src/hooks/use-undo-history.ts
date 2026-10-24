import { useReducer } from 'react';

const DEFAULT_LIMIT = 60;

type History<T> = { present: T; past: T[]; coalesceKey: string | null };

type Action<T> =
  | { type: 'set'; next: T; coalesceKey: string | null; limit: number }
  | { type: 'undo' }
  | { type: 'reset'; value: T }
  | { type: 'endCoalesce' };

function reduce<T>(state: History<T>, action: Action<T>): History<T> {
  switch (action.type) {
    case 'set': {
      const { next } = action;
      if (Object.is(next, state.present)) return state;
      if (action.coalesceKey !== null && action.coalesceKey === state.coalesceKey) {
        return { ...state, present: next };
      }
      return {
        present: next,
        past: [...state.past, state.present].slice(-action.limit),
        coalesceKey: action.coalesceKey,
      };
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (previous === undefined) return state;
      return { present: previous, past: state.past.slice(0, -1), coalesceKey: null };
    }
    case 'reset':
      return { present: action.value, past: [], coalesceKey: null };
    default:
      return state.coalesceKey === null ? state : { ...state, coalesceKey: null };
  }
}

// Snapshot history for an editor draft: every `set` keeps the previous value so `undo` can step back
// (up to `limit` steps). Edits that share a `coalesceKey` in a row, such as typing in one field, count as one step.
export function useUndoHistory<T>(initial: T, limit = DEFAULT_LIMIT) {
  const [state, dispatch] = useReducer(reduce<T>, {
    present: initial,
    past: [],
    coalesceKey: null,
  });
  return {
    value: state.present,
    canUndo: state.past.length > 0,
    set: (next: T, options?: { coalesceKey?: string }) =>
      dispatch({ type: 'set', next, coalesceKey: options?.coalesceKey ?? null, limit }),
    undo: () => dispatch({ type: 'undo' }),
    endCoalesce: () => dispatch({ type: 'endCoalesce' }),
    reset: (value: T) => dispatch({ type: 'reset', value }),
  };
}
