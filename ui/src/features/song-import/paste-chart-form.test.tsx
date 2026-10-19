import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportedChart } from '@/features/song-import/api';
import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { PasteChartForm } from './paste-chart-form';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('PasteChartForm', () => {
  it('shows the translated message for a 422 (no chords found)', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/convert')) {
        return new Response('nope', { status: 422 });
      }
      throw new Error(`unexpected fetch to ${url}`);
    });

    renderWithQueryAndRouter(
      <PasteChartForm onImported={vi.fn<(chart: ImportedChart) => void>()} />
    );

    await user.type(await screen.findByLabelText('Paste the chord chart text'), 'just plain text');
    await user.click(screen.getByRole('button', { name: 'Convert' }));

    expect(
      await screen.findByText("Couldn't find a chord chart on that page.")
    ).toBeInTheDocument();
  });

  it('calls onImported with the converted chart on success', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/convert')) {
        return new Response(
          JSON.stringify({
            source: 'text',
            url: null,
            title: '',
            artist: '',
            originalKey: 'G',
            bpm: null,
            chordLyrics: '{Verse 1}\n[G]Invented lyric line',
          })
        );
      }
      throw new Error(`unexpected fetch to ${url}`);
    });

    const onImported = vi.fn<(chart: ImportedChart) => void>();
    renderWithQueryAndRouter(<PasteChartForm onImported={onImported} />);

    await user.type(
      await screen.findByLabelText('Paste the chord chart text'),
      '[G]Invented lyric line'
    );
    await user.click(screen.getByRole('button', { name: 'Convert' }));

    await waitFor(() => expect(onImported).toHaveBeenCalledTimes(1));
    expect(onImported.mock.calls[0]?.[0]).toMatchObject({
      chordLyrics: '{Verse 1}\n[G]Invented lyric line',
    });
  });
});
