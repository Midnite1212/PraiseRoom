import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import type { ImportedChart } from './api';
import { ImportForm } from './import-form';

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

const chart: ImportedChart = {
  source: 'worshiptogether',
  url: 'https://worshiptogether.com/songs/invented-song',
  title: 'Invented Song',
  artist: 'Invented Artist',
  originalKey: 'C',
  bpm: 100,
  chordLyrics: '{Verse 1}\n[C]Test [G]line',
};

const noopResolve = (_response: Response): void => {};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('ImportForm', () => {
  it('renders the converted chart in the live preview', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) return emptyMetadata();
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    renderWithQueryAndRouter(
      <ImportForm
        chart={chart}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={vi.fn<() => void>()}
      />
    );

    expect(await screen.findByText('line')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('transposes the raw chart text when the recording-key suggestion is applied', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) {
        return new Response(
          JSON.stringify({
            recordingKey: 'D',
            bpm: null,
            tempo: null,
            timeSignature: null,
            year: null,
            sources: [],
          })
        );
      }
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    const user = userEvent.setup();
    renderWithQueryAndRouter(
      <ImportForm
        chart={chart}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={vi.fn<() => void>()}
      />
    );

    const suggestion = await screen.findByRole('button', { name: 'Recording key: D — use it' });
    await user.click(suggestion);

    await user.click(screen.getByRole('button', { name: 'Edit raw chart text' }));
    const raw = await screen.findByDisplayValue(/\[D\]Test \[A\]line/);
    expect(raw).toBeInTheDocument();
  });

  it('fills tempo and time signature from metadata but leaves a field the user already edited', async () => {
    let resolveMetadata: (response: Response) => void = noopResolve;
    const metadataPromise = new Promise<Response>((resolve) => {
      resolveMetadata = resolve;
    });

    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) return metadataPromise;
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    const user = userEvent.setup();
    renderWithQueryAndRouter(
      <ImportForm
        chart={chart}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={vi.fn<() => void>()}
      />
    );

    const yearInput = await screen.findByLabelText('Year');
    await user.type(yearInput, '1999');

    resolveMetadata(
      new Response(
        JSON.stringify({
          recordingKey: null,
          bpm: null,
          tempo: 'Fast',
          timeSignature: '3/4',
          year: '2001',
          sources: [],
        })
      )
    );

    await waitFor(() => expect(screen.getByText('Fast')).toBeInTheDocument());
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(yearInput).toHaveValue('1999');
  });

  it('looks up metadata for a pasted chart once title and artist are filled in', async () => {
    const metadataUrls: string[] = [];
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) {
        metadataUrls.push(url);
        return emptyMetadata();
      }
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });

    const user = userEvent.setup();
    renderWithQueryAndRouter(
      <ImportForm
        chart={{ ...chart, source: 'text', url: null, title: '', artist: '' }}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={vi.fn<() => void>()}
      />
    );

    await user.type(await screen.findByLabelText('Title'), 'Invented Song');
    await user.tab();
    expect(metadataUrls).toHaveLength(0);

    await user.type(screen.getByLabelText('Artist'), 'Invented Artist');
    await user.tab();
    await waitFor(() => expect(metadataUrls).toHaveLength(1));
    expect(metadataUrls[0]).toContain('title=Invented+Song');
    expect(metadataUrls[0]).toContain('artist=Invented+Artist');
  });

  it('does not mark the form edited when metadata fills fields', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) {
        return new Response(
          JSON.stringify({
            recordingKey: null,
            bpm: 72,
            tempo: 'Slow',
            timeSignature: '4/4',
            year: '2010',
          })
        );
      }
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });
    const onDirtyChange = vi.fn<(dirty: boolean) => void>();

    renderWithQueryAndRouter(
      <ImportForm chart={chart} onDirtyChange={onDirtyChange} onSaved={vi.fn<() => void>()} />
    );

    expect(await screen.findByDisplayValue('2010')).toBeInTheDocument();
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it('saves the song with the edited fields', async () => {
    const created: unknown[] = [];
    fetchMock.mockImplementation(async (input, init) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) return emptyMetadata();
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      if (url.startsWith('/api/songs/create')) {
        created.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null);
        return new Response(
          JSON.stringify({
            _id: '507f1f77bcf86cd799439031',
            urlKey: 'k3x9p2',
            title: 'Invented Song',
          })
        );
      }
      throw new Error(`unexpected fetch to ${url}`);
    });
    const onSaved = vi.fn<() => void>();
    const user = userEvent.setup();

    renderWithQueryAndRouter(
      <ImportForm
        chart={chart}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={onSaved}
      />
    );

    const year = await screen.findByLabelText('Year');
    await user.type(year, '2014');
    await user.click(screen.getByRole('button', { name: 'Save song' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(created).toEqual([
      expect.objectContaining({
        title: 'Invented Song',
        artist: 'Invented Artist',
        originalKey: 'C',
        chordLyrics: '{Verse 1}\n[C]Test [G]line',
        year: '2014',
      }),
    ]);
  });

  it('relabels a relative key without moving the chords, and can relabel without transposing', async () => {
    let recordingKey = 'Em';
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/metadata')) {
        return new Response(
          JSON.stringify({ recordingKey, bpm: null, tempo: null, timeSignature: null, year: null })
        );
      }
      if (url.startsWith('/api/songs/search')) return emptySongSearch();
      throw new Error(`unexpected fetch to ${url}`);
    });
    const user = userEvent.setup();

    renderWithQueryAndRouter(
      <ImportForm
        chart={{ ...chart, originalKey: 'G', chordLyrics: '{Verse 1}\n[G]Test [C]line' }}
        onDirtyChange={vi.fn<(dirty: boolean) => void>()}
        onSaved={vi.fn<() => void>()}
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Recording key: Em — use it' }));
    await user.click(screen.getByRole('button', { name: 'Edit raw chart text' }));
    expect(await screen.findByDisplayValue(/\[G\]Test \[C\]line/)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Move the chords with the key' }));
    recordingKey = 'A';
    await user.clear(screen.getByLabelText('Artist'));
    await user.type(screen.getByLabelText('Artist'), 'Other Artist');
    await user.tab();
    await user.click(await screen.findByRole('button', { name: 'Recording key: A — use it' }));
    expect(screen.getByDisplayValue(/\[G\]Test \[C\]line/)).toBeInTheDocument();
  });
});
