import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SongSummary } from './api';
import { SongsTable } from './songs-table';

const song: SongSummary = {
  _id: '0123456789abcdef01234567',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  tempo: ['Slow', 'Medium'],
  code: null,
};

describe('SongsTable', () => {
  it('renders one row per song with translated headers', () => {
    render(<SongsTable songs={[song]} />);

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Amazing Grace' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Slow, Medium' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no songs', () => {
    render(<SongsTable songs={[]} />);

    expect(screen.getByText('No songs found.')).toBeInTheDocument();
  });
});
