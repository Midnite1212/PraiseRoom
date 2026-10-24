import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import type { Song } from './api';
import { SongEditor } from './song-editor';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn<(message: string) => void>(), {
    error: vi.fn<(message: string) => void>(),
  }),
}));

const song: Song = {
  _id: '507f1f77bcf86cd799439021',
  title: 'Invented Song',
  artist: 'Invented Artist',
  originalKey: 'E',
  chordLyrics: '{Verse 1}\n[E]Test [A]line\n\n{Chorus}\nSecond words',
  capo: 6,
  year: null,
  code: null,
  tempo: ['Slow'],
  timeSignature: ['4/4'],
  themes: [],
  recommendedKeys: [],
};

const fetchMock = vi.fn<typeof fetch>();
let updates: Record<string, unknown>[] = [];

beforeEach(() => {
  updates = [];
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async (input, init) => {
    const url = requestUrl(input);
    if (url.startsWith('/api/auth/get-session')) return sessionResponse();
    if (url.startsWith('/api/songs/update')) {
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      if (typeof body === 'object' && body !== null) updates.push({ ...body });
      return new Response(JSON.stringify({ _id: song._id }));
    }
    if (url.startsWith('/api/songs/search')) {
      return new Response(
        JSON.stringify({ data: [], totalCount: 0, currentPage: 1, totalPages: 1 })
      );
    }
    throw new Error(`unexpected fetch to ${url}`);
  });
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const lastUpdate = () => updates.at(-1);

const openText = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('radio', { name: 'Text' }));
  return screen.findByRole('textbox', { name: 'Lyrics and chords' });
};

describe('SongEditor', () => {
  it('shows the song as sections of words and saves nothing until something changes', async () => {
    renderWithQueryAndRouter(<SongEditor song={song} />);

    expect(await screen.findByRole('textbox', { name: 'Song title' })).toHaveValue('Invented Song');
    expect(screen.getByRole('button', { name: 'Chord A on line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a chord to words' })).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(updates).toHaveLength(0);
  });

  it('puts a chord from the key palette over a word and saves the ChordPro text', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.click(await screen.findByRole('button', { name: 'Add a chord to Second' }));
    await user.click(await screen.findByRole('button', { name: /^C#m/ }));

    await waitFor(() => expect(updates).toHaveLength(1), { timeout: 3000 });
    expect(lastUpdate()).toMatchObject({
      id: song._id,
      chordLyrics: '{Verse 1}\n[E]Test [A]line\n\n{Chorus}\n[C#m]Second words',
      originalKey: 'E',
      capo: 6,
      tempo: ['Slow'],
      timeSignature: ['4/4'],
      themes: [],
      code: null,
    });
  });

  it('places a custom chord and refuses one it cannot read', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.click(await screen.findByRole('button', { name: 'Add a chord to words' }));
    const input = await screen.findByRole('textbox', { name: 'Another chord' });
    await user.type(input, 'nope');
    expect(screen.getByRole('button', { name: 'Set' })).toBeDisabled();
    await user.clear(input);
    await user.type(input, 'D/F#');
    await user.click(screen.getByRole('button', { name: 'Set' }));

    await waitFor(() => expect(updates).toHaveLength(1), { timeout: 3000 });
    expect(lastUpdate()?.chordLyrics).toBe(
      '{Verse 1}\n[E]Test [A]line\n\n{Chorus}\nSecond [D/F#]words'
    );
  });

  it('follows the first chord for the key until a key is chosen', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(
      <SongEditor song={{ ...song, chordLyrics: '{Verse 1}\nplain words' }} />
    );

    expect(await screen.findByRole('button', { name: /Key.*E.*auto/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add a chord to plain' }));
    await user.click(await screen.findByRole('button', { name: /^F#m/ }));

    await waitFor(() => expect(updates).toHaveLength(1), { timeout: 3000 });
    expect(lastUpdate()).toMatchObject({ originalKey: 'F#m' });
  });

  it('sends themes and the code', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.type(await screen.findByRole('textbox', { name: 'Song code' }), 'N042');
    await user.click(screen.getByRole('button', { name: /Themes/ }));
    await user.click(await screen.findByRole('button', { name: 'Hope' }));

    await waitFor(() => expect(lastUpdate()).toMatchObject({ code: 'N042', themes: ['Hope'] }), {
      timeout: 3000,
    });
  });

  it('renames, adds and removes sections', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    const chorusName = await screen.findByDisplayValue('Chorus');
    await user.clear(chorusName);
    await user.type(chorusName, 'Refrain');
    await user.click(screen.getByRole('button', { name: 'Chorus' }));
    await user.click(screen.getByRole('button', { name: 'Remove Verse 1' }));

    await waitFor(
      () => expect(lastUpdate()?.chordLyrics).toBe('{Refrain}\nSecond words\n\n{Chorus}'),
      { timeout: 3000 }
    );
  });

  it('undoes the last change', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.click(await screen.findByRole('button', { name: 'Add a chord to Second' }));
    await user.click(await screen.findByRole('button', { name: /^AIV$/ }));
    expect(screen.getByRole('button', { name: 'Chord A on Second' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Add a chord to Second' })).toBeInTheDocument();
  });

  it('does not save without a title and holds Done back', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SongEditor song={song} />);

    await user.clear(await screen.findByRole('textbox', { name: 'Song title' }));
    expect(screen.getByText('Not saved yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Done/ }));

    expect(toast.error).toHaveBeenCalledWith('Give the song a title before you leave.');
    expect(updates).toHaveLength(0);
  });

  describe('Text mode', () => {
    it('opens on Text mode with the textarea focused when asked to', async () => {
      renderWithQueryAndRouter(<SongEditor song={song} initialMode="text" />);

      const text = await screen.findByRole('textbox', { name: 'Lyrics and chords' });
      expect(text).toHaveFocus();
      expect(screen.getByRole('radio', { name: 'Text' })).toBeChecked();
    });

    it('shows the song as ChordPro and saves what is typed', async () => {
      const user = userEvent.setup();
      renderWithQueryAndRouter(<SongEditor song={song} />);

      const text = await openText(user);
      expect(text).toHaveValue(song.chordLyrics);
      await user.type(text, '\n\nmore');
      expect(text).toHaveValue(`${song.chordLyrics}\n\nmore`);

      await waitFor(() => expect(lastUpdate()?.chordLyrics).toBe(`${song.chordLyrics}\n\nmore`), {
        timeout: 3000,
      });
    });

    it('puts a chord from the live preview into the text and undoes it', async () => {
      const user = userEvent.setup();
      renderWithQueryAndRouter(<SongEditor song={song} />);

      const text = await openText(user);
      await user.click(screen.getByRole('button', { name: 'Add a chord to Second' }));
      await user.click(await screen.findByRole('button', { name: /^AIV$/ }));
      expect(text).toHaveValue('{Verse 1}\n[E]Test [A]line\n\n{Chorus}\n[A]Second words');

      await user.click(screen.getByRole('button', { name: 'Undo' }));
      expect(text).toHaveValue(song.chordLyrics);
    });

    it('folds a pasted chords-above-lyrics chart into inline chords', async () => {
      const user = userEvent.setup();
      renderWithQueryAndRouter(<SongEditor song={{ ...song, chordLyrics: '{Verse 1}' }} />);

      const text = await openText(user);
      await user.click(text);
      await user.paste('G   C\nHello there');

      expect(text).toHaveValue('{Verse 1}[G]Hell[C]o there');
      expect(toast).toHaveBeenCalledWith('Chords placed over their words');
    });

    it('keeps the same draft when switching back to Song mode', async () => {
      const user = userEvent.setup();
      renderWithQueryAndRouter(<SongEditor song={song} />);

      const text = await openText(user);
      await user.clear(text);
      await user.click(text);
      await user.paste('{Chorus}\n[G]Hi there');
      await user.click(screen.getByRole('radio', { name: 'Song' }));

      expect(await screen.findByRole('button', { name: 'Chord G on Hi' })).toBeInTheDocument();
    });
  });
});
