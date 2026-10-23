import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import type { SongSummary } from './api';
import { SongsTable } from './songs-table';

const song: SongSummary = {
  _id: '0123456789abcdef01234567',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  tempo: ['Slow', 'Medium'],
  timeSignature: ['4/4'],
  themes: ['Grace'],
  code: null,
};

describe('SongsTable', () => {
  it('renders one row per song with translated headers and links each title', async () => {
    renderWithRouter(<SongsTable songs={[song]} />);

    expect(await screen.findByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Amazing Grace' })).toHaveAttribute(
      'href',
      '/songs/0123456789abcdef01234567'
    );
    expect(screen.getByRole('cell', { name: 'Amazing Grace' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Slow, Medium' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Grace' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no songs', async () => {
    renderWithRouter(<SongsTable songs={[]} />);

    expect(await screen.findByText('No songs found.')).toBeInTheDocument();
  });
});
