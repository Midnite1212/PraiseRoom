import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { useSongImport } from './use-song-import';
import { WebResults } from './web-results';

function SongImportFlow({ q }: { q: string }) {
  const { pickUrl, openPaste, element } = useSongImport();
  return (
    <>
      <WebResults q={q} onPickUrl={pickUrl} onPaste={openPaste} />
      {element}
    </>
  );
}

const emptySongSearch = () =>
  new Response(JSON.stringify({ data: [], totalCount: 0, currentPage: 1, totalPages: 1 }));

const emptyMetadata = () =>
  new Response(
    JSON.stringify({
      recordingKey: null,
      bpm: null,
      tempo: null,
      timeSignature: null,
      year: null,
      sources: [],
    })
  );

const ignoreResponse = (_response: Response): void => {};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('useSongImport', () => {
  it('fetches a picked search result and previews the converted chart in the dialog', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/search')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                source: 'pnwchords',
                url: 'https://pnwchords.com/invented-song',
                title: 'Invented Song',
                artist: 'Invented Artist',
                votes: null,
              },
            ],
            unavailable: [],
          })
        );
      }
      if (url.startsWith('/api/songs/import/fetch')) {
        return new Response(
          JSON.stringify({
            source: 'pnwchords',
            url: 'https://pnwchords.com/invented-song',
            title: 'Invented Song',
            artist: 'Invented Artist',
            originalKey: 'C',
            bpm: 90,
            chordLyrics: '{Verse 1}\n[C]Invented [G]lyric',
          })
        );
      }
      if (url.startsWith('/api/songs/import/metadata')) return emptyMetadata();
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    renderWithQueryAndRouter(<SongImportFlow q="Invented Song" />);

    const candidate = await screen.findByText('Invented Song');
    await user.click(candidate);

    expect(await screen.findByText('Invented')).toBeInTheDocument();
    expect(screen.getByText('lyric')).toBeInTheDocument();
  });

  it('drops a chart that arrives after the dialog was closed', async () => {
    const user = userEvent.setup();
    let resolveFetch: (response: Response) => void = ignoreResponse;
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/search')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                source: 'pnwchords',
                url: 'https://pnwchords.com/invented-song',
                title: 'Invented Song',
                artist: 'Invented Artist',
                votes: null,
              },
            ],
            unavailable: [],
          })
        );
      }
      if (url.startsWith('/api/songs/import/fetch')) {
        return new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        });
      }
      if (url.startsWith('/api/songs/import/metadata')) return emptyMetadata();
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    renderWithQueryAndRouter(<SongImportFlow q="Invented Song" />);
    await user.click(await screen.findByText('Invented Song'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    resolveFetch(
      new Response(
        JSON.stringify({
          source: 'pnwchords',
          url: 'https://pnwchords.com/invented-song',
          title: 'Invented Song',
          artist: 'Invented Artist',
          originalKey: 'C',
          bpm: null,
          chordLyrics: '{Verse 1}\n[C]Invented [G]lyric',
        })
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('drops a pasted chart that converts after the dialog was closed', async () => {
    const user = userEvent.setup();
    let resolveConvert: (response: Response) => void = ignoreResponse;
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/search')) {
        return new Response(JSON.stringify({ candidates: [], unavailable: [] }));
      }
      if (url.startsWith('/api/songs/import/convert')) {
        return new Promise<Response>((resolve) => {
          resolveConvert = resolve;
        });
      }
      throw new Error(`unexpected fetch to ${url}`);
    });

    renderWithQueryAndRouter(<SongImportFlow q="Invented Song" />);
    await user.click(await screen.findByRole('button', { name: 'Paste a chart' }));
    await user.type(await screen.findByRole('textbox'), 'G   C\nInvented line');
    await user.click(screen.getByRole('button', { name: 'Convert' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    resolveConvert(
      new Response(
        JSON.stringify({
          source: 'text',
          url: null,
          title: '',
          artist: '',
          originalKey: 'G',
          bpm: null,
          chordLyrics: '[G]Invented [C]line',
        })
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
