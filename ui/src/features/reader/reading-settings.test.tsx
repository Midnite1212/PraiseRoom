import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ReadingSettings } from './reading-settings';

const renderSettings = async (showSettingsLink?: boolean) => {
  const root = createRootRoute({
    component: () => <ReadingSettings showSettingsLink={showSettingsLink} />,
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
});
