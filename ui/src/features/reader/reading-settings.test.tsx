import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PresentSong } from './present-slides';
import { ReadingSettings } from './reading-settings';

const presentSongs: PresentSong[] = [
  {
    id: 'a',
    title: 'First Song',
    artist: 'Test Artist',
    chordLyrics: '{Verse 1}\nLine one',
    originalKey: null,
    playKey: null,
    capo: 0,
  },
  {
    id: 'b',
    title: 'Second Song',
    artist: 'Other Artist',
    chordLyrics: '{Verse 1}\nLine two',
    originalKey: null,
    playKey: null,
    capo: 0,
  },
];

const renderSettings = async (
  showSettingsLink?: boolean,
  present?: ComponentProps<typeof ReadingSettings>['present']
) => {
  const root = createRootRoute({
    component: () => <ReadingSettings showSettingsLink={showSettingsLink} present={present} />,
  });
  const settings = createRoute({
    getParentRoute: () => root,
    path: '/settings',
    component: () => null,
  });
  const router = createRouter({
    routeTree: root.addChildren([settings]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Reading settings' }));
  return user;
};

describe('ReadingSettings', () => {
  afterEach(() => localStorage.clear());

  it('stores the sharps and flats choice and the chord style choice', async () => {
    const user = await renderSettings();

    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Flats' }));
    expect(screen.getByRole('radio', { name: 'Flats' })).toBeChecked();
    expect(localStorage.getItem('chord-accidentals')).toBe('flat');

    expect(screen.getByRole('radio', { name: 'Full' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Simple' }));
    expect(localStorage.getItem('chord-style')).toBe('simple');
  });

  it('stores the colour chords switch, off by default', async () => {
    const user = await renderSettings();

    const colour = screen.getByRole('switch', { name: 'Colour chords' });
    expect(colour).not.toBeChecked();
    await user.click(colour);
    expect(colour).toBeChecked();
    expect(localStorage.getItem('chord-colour')).toBe('on');
  });

  it('stores the keep screen awake switch, on by default, with a note', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: vi.fn<() => Promise<void>>() },
    });
    const user = await renderSettings();

    const awake = screen.getByRole('switch', { name: 'Keep screen awake' });
    expect(awake).toBeChecked();
    expect(screen.getByText('On while this page is open')).toBeInTheDocument();
    await user.click(awake);
    expect(awake).not.toBeChecked();
    expect(localStorage.getItem('keep-awake')).toBe('off');
    expect(screen.queryByText('On while this page is open')).not.toBeInTheDocument();
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('says so where the browser has no Wake Lock', async () => {
    await renderSettings();

    expect(screen.getByText('Not supported in this browser')).toBeInTheDocument();
  });

  it('has theme and language controls', async () => {
    await renderSettings();

    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
  });

  it('links to Settings, except on the public link', async () => {
    await renderSettings();
    expect(screen.getByRole('link', { name: 'More in Settings' })).toHaveAttribute(
      'href',
      '/settings'
    );
  });

  it('leaves out the Settings link when asked', async () => {
    await renderSettings(false);
    expect(screen.queryByRole('link', { name: 'More in Settings' })).not.toBeInTheDocument();
  });

  it('has no Present to TV row without songs to present', async () => {
    await renderSettings();
    expect(screen.queryByRole('button', { name: /Present to TV/ })).not.toBeInTheDocument();
  });

  it('presents from the set, closes the tray, and reports the song it stopped on', async () => {
    const onStart = vi.fn<() => void>();
    const onExit = vi.fn<(songIndex: number) => void>();
    const user = await renderSettings(true, {
      songs: presentSongs,
      startIndex: 1,
      onStart,
      onExit,
    });

    await user.click(screen.getByRole('button', { name: /Present to TV/ }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Second Song' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Theme' })).not.toBeInTheDocument();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    await user.click(screen.getByRole('button', { name: 'Exit' }));
    expect(onExit).toHaveBeenCalledWith(0);
    expect(screen.queryByRole('heading', { name: 'First Song' })).not.toBeInTheDocument();
  });
});
