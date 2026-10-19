import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { WebResults } from './web-results';

const fetchMock = vi.fn<typeof fetch>();

const renderWebResults = (props: {
  q: string;
  onPickUrl: (url: string) => void;
  onPaste: () => void;
}) => renderWithQueryAndRouter(<WebResults {...props} />);

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('WebResults', () => {
  it('shows a single "import from this link" row for a supported chord-site URL', async () => {
    renderWebResults({
      q: 'https://tabs.ultimate-guitar.com/tab/invented-artist/invented-song-chords-123',
      onPickUrl: vi.fn<(url: string) => void>(),
      onPaste: vi.fn<() => void>(),
    });

    expect(await screen.findByText('Import from this link')).toBeInTheDocument();
    expect(screen.getByText('Ultimate Guitar')).toBeInTheDocument();
  });

  it('searches and lists candidates for a plain title, calling onPickUrl when one is chosen', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.startsWith('/api/auth/get-session')) return sessionResponse();
      if (url.startsWith('/api/songs/import/search')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                source: 'worshiptogether',
                url: 'https://worshiptogether.com/songs/invented-song',
                title: 'Invented Song',
                artist: 'Invented Artist',
                votes: null,
              },
            ],
            unavailable: ['pnwchords'],
          })
        );
      }
      throw new Error(`unexpected fetch to ${url}`);
    });

    const onPickUrl = vi.fn<(url: string) => void>();
    renderWebResults({ q: 'Invented Song', onPickUrl, onPaste: vi.fn<() => void>() });

    const candidate = await screen.findByText('Invented Song');
    expect(screen.getByText('WorshipTogether')).toBeInTheDocument();
    expect(screen.getByText('PNW Chords could not be searched right now.')).toBeInTheDocument();

    await user.click(candidate);
    expect(onPickUrl).toHaveBeenCalledWith('https://worshiptogether.com/songs/invented-song');
  });
});
