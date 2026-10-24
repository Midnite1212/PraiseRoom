import { describe, expect, it } from 'vitest';

import { inviteUrl } from './api';

describe('inviteUrl', () => {
  it('builds the join link on the given origin', () => {
    expect(inviteUrl('AbCdEfGhIjKlMnOpQrStUvWx', 'https://praiseroom.vercel.app')).toBe(
      'https://praiseroom.vercel.app/join/AbCdEfGhIjKlMnOpQrStUvWx'
    );
  });
});
