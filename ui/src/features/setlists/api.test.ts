import { describe, expect, it } from 'vitest';

import { publicSetlistUrl } from './api';

describe('publicSetlistUrl', () => {
  it('builds the public view link on the given origin', () => {
    expect(publicSetlistUrl('68cfc5ca92a58a4a2a791193', 'https://praiseroom.vercel.app')).toBe(
      'https://praiseroom.vercel.app/setlist/view/68cfc5ca92a58a4a2a791193'
    );
  });
});
