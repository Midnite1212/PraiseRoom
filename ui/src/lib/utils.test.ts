import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('keeps a text colour next to a type-scale size', () => {
    expect(cn('text-primary-foreground', 'text-ui')).toBe('text-primary-foreground text-ui');
    expect(cn('text-card-title', 'text-page-title')).toBe('text-page-title');
  });
});
