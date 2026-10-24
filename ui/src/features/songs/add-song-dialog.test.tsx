import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { AddSongDialog } from './add-song-dialog';

const fetchMock = vi.fn<typeof fetch>();
const created: unknown[] = [];

beforeEach(() => {
  created.length = 0;
  fetchMock.mockImplementation(async (input, init) => {
    const url = requestUrl(input);
    if (url.startsWith('/api/auth/get-session')) return sessionResponse();
    if (url.startsWith('/api/songs/create')) {
      created.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null);
      return new Response(JSON.stringify({ _id: '507f1f77bcf86cd799439031' }));
    }
    throw new Error(`unexpected fetch to ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const renderDialog = () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const onFindOnWeb = vi.fn<(query: string) => void>();
  renderWithQueryAndRouter(
    <AddSongDialog open onOpenChange={onOpenChange} onFindOnWeb={onFindOnWeb} />
  );
  return { onOpenChange, onFindOnWeb, user: userEvent.setup() };
};

describe('AddSongDialog', () => {
  it('asks for a title before any tile starts a song', async () => {
    const { user } = renderDialog();

    await user.click(await screen.findByRole('button', { name: /Write it/ }));

    expect(await screen.findByText('Enter a song title.')).toBeInTheDocument();
    expect(created).toEqual([]);
  });

  it('creates the song with the defaults and "Unknown" when no artist is given', async () => {
    const { user, onOpenChange } = renderDialog();

    await user.type(await screen.findByLabelText('Song title'), '  Invented Song ');
    await user.click(screen.getByRole('button', { name: /Paste a chart/ }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(created).toEqual([
      expect.objectContaining({
        title: 'Invented Song',
        artist: 'Unknown',
        originalKey: 'C',
        tempo: ['Medium'],
        timeSignature: ['4/4'],
        chordLyrics: '{Verse 1}',
      }),
    ]);
  });

  it('hands the title and artist to the web search without creating a song', async () => {
    const { user, onFindOnWeb, onOpenChange } = renderDialog();

    await user.type(await screen.findByLabelText('Song title'), 'Invented Song');
    await user.type(screen.getByLabelText('Artist or writer'), 'Invented Artist');
    await user.click(screen.getByRole('button', { name: /Find on the web/ }));

    await waitFor(() => expect(onFindOnWeb).toHaveBeenCalledWith('Invented Song Invented Artist'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(created).toEqual([]);
  });
});
