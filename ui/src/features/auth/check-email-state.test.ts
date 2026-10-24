import { afterEach, describe, expect, it } from 'vitest';

import { readCheckEmailState, saveCheckEmailState } from './check-email-state';

afterEach(() => sessionStorage.clear());

describe('check-email state', () => {
  it('reads back what was saved', () => {
    saveCheckEmailState({ email: 'dummy@example.com', kind: 'reset' });
    expect(readCheckEmailState()).toEqual({ email: 'dummy@example.com', kind: 'reset' });
  });

  it('is null when nothing, or something invalid, is stored', () => {
    expect(readCheckEmailState()).toBeNull();
    sessionStorage.setItem('check-email', '{"email":"","kind":"other"}');
    expect(readCheckEmailState()).toBeNull();
    sessionStorage.setItem('check-email', 'not json');
    expect(readCheckEmailState()).toBeNull();
  });
});
