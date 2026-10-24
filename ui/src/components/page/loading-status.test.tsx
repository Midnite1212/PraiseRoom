import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingStatus } from './loading-status';

describe('LoadingStatus', () => {
  it('announces the message as a status', () => {
    render(<LoadingStatus>Searching songs…</LoadingStatus>);
    expect(screen.getByRole('status')).toHaveTextContent('Searching songs…');
  });
});
