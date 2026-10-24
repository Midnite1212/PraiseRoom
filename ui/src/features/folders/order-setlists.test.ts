import { describe, expect, it } from 'vitest';

import { orderFolderSetlists } from './order-setlists';

const now = new Date(2026, 9, 24, 12).getTime();
const ids = (dates: (string | null)[]) =>
  orderFolderSetlists(
    dates.map((date, index) => ({ _id: String(index), date })),
    now
  ).map(({ _id }) => _id);

describe('orderFolderSetlists', () => {
  it('puts upcoming sets first, soonest on top', () => {
    expect(ids(['2026-11-08', '2026-10-24', '2026-10-30'])).toEqual(['1', '2', '0']);
  });

  it('follows with undated sets, then past sets newest first', () => {
    expect(ids(['2026-09-01', '2026-10-01', null, '2026-11-01'])).toEqual(['3', '2', '1', '0']);
  });

  it('keeps an empty list empty', () => {
    expect(ids([])).toEqual([]);
  });
});
