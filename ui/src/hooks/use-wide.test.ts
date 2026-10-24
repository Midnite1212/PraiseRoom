import { describe, expect, it } from 'vitest';

import { COMPACT_QUERY, ROOMY_QUERY, WIDE_QUERY } from './use-wide';

import styles from '@/styles.css?raw';

describe('wide breakpoint', () => {
  it('is the same query in the CSS variant and the hook', () => {
    expect(styles).toContain(`@media ${WIDE_QUERY} {`);
  });

  it('keeps the roomy variant and hook query equal', () => {
    expect(styles).toContain(`@custom-variant roomy {\n  @media ${ROOMY_QUERY} {`);
  });

  it('keeps the compact variant and hook query equal', () => {
    expect(styles).toContain(`@custom-variant compact {\n  @media ${COMPACT_QUERY} {`);
  });

  it('does not depend on orientation', () => {
    expect(WIDE_QUERY).not.toContain('orientation');
  });
});
