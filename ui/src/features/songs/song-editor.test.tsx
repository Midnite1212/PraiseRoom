import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import type { Song } from './api';
import { SongEditor } from './song-editor';

const song: Song = {
  _id: '507f1f77bcf86cd799439021',
  title: 'Invented Song',
  artist: 'Invented Artist',
  originalKey: 'E',
  chordLyrics: '{Verse 1}\n[E]Test [A]line',
  capo: 6,
  year: null,
  code: null,
  tempo: ['Slow'],
  timeSignature: ['4/4'],
  themes: [],
  recommendedKeys: [],
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('SongEditor', () => {
  it('starts from the saved song and sends every edited field, capo included', async () => {
    const updates: unknown[] = [];
    fetchMock.mockImplementation(async (input, init) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/update')) {
        updates.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null);
        return new Response(JSON.stringify({ _id: song._id }));
      }
      throw new Error(`unexpected fetch to ${url}`);
    });
    const user = userEvent.setup();

    renderWithQueryAndRouter(<SongEditor song={song} />);

    expect(await screen.findByLabelText('Capo')).toHaveTextContent('6');
    expect(screen.getByText('line')).toBeInTheDocument();

    const title = screen.getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'Renamed Song');
    await user.type(screen.getByLabelText('Year'), '2014');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({
      id: song._id,
      title: 'Renamed Song',
      artist: 'Invented Artist',
      originalKey: 'E',
      chordLyrics: '{Verse 1}\n[E]Test [A]line',
      tempo: ['Slow'],
      timeSignature: ['4/4'],
      year: '2014',
      capo: 6,
    });
  });

  it('does not save without a title', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      throw new Error(`unexpected fetch to ${url}`);
    });
    const user = userEvent.setup();

    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.clear(await screen.findByLabelText('Title'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Give the song a title.')).toBeInTheDocument();
  });
});
