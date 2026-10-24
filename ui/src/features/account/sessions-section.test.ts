import { describe, expect, it } from 'vitest';

import { orderSessions } from './sessions-section';

const session = (id: string, updatedAt: string) => ({ id, token: `t-${id}`, updatedAt });

describe('orderSessions', () => {
  it('puts this device first, then the rest by most recent activity', () => {
    const ordered = orderSessions(
      [
        session('old', '2026-01-01T00:00:00Z'),
        session('here', '2025-01-01T00:00:00Z'),
        session('new', '2026-03-01T00:00:00Z'),
      ],
      't-here'
    );
    expect(ordered.map(({ id }) => id)).toEqual(['here', 'new', 'old']);
  });

  it('sorts by activity alone when the current session is unknown, without changing the input', () => {
    const input = [session('a', '2026-01-01T00:00:00Z'), session('b', '2026-02-01T00:00:00Z')];
    expect(orderSessions(input, null).map(({ id }) => id)).toEqual(['b', 'a']);
    expect(input.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});
