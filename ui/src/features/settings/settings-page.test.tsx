import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Session } from '@/features/auth/session';
import { changeLanguage } from '@/i18n';
import { syncAccent } from '@/lib/accent';
import { syncTypeface } from '@/lib/typeface';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { SettingsPage } from './settings-page';

const session: Session = {
  id: 'user-1',
  email: 'dummy@example.com',
  fullName: 'Test Member',
  accessType: 'editor',
  ownership: {
    _id: 'ownership-1',
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'editor',
    groupIds: [],
    setlistIds: [],
  },
};

const renderPage = async () => {
  renderWithQueryAndRouter(<SettingsPage session={session} />);
  await screen.findByRole('heading', { name: /Settings|設定/ });
};

const previewOf = () => screen.getByRole('complementary', { name: /Preview of a song/ });

afterEach(async () => {
  vi.unstubAllGlobals();
  await changeLanguage('en');
  localStorage.clear();
  delete document.documentElement.dataset.typeface;
  delete document.documentElement.dataset.palette;
});

describe('SettingsPage', () => {
  it('names the signed-in account with its role', async () => {
    await renderPage();

    expect(screen.getByText('Test Member')).toBeInTheDocument();
    expect(screen.getByText('dummy@example.com')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('selects IBM Plex and large by default', async () => {
    await renderPage();

    expect(screen.getByRole('radio', { name: /IBM Plex/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
  });

  it('offers every typeface and keeps the chosen one for next time', async () => {
    const stop = syncTypeface();
    await renderPage();
    expect(
      screen.getAllByRole('radio', { name: /IBM Plex|Geist|Hanken|Pixel|Mono|System/ })
    ).toHaveLength(6);

    await userEvent.click(screen.getByRole('radio', { name: /Pixel/ }));

    expect(screen.getByRole('radio', { name: /Pixel/ })).toBeChecked();
    expect(document.documentElement.dataset.typeface).toBe('pixel');
    expect(localStorage.getItem('typeface')).toBe('pixel');
    stop();
  });

  it('switches the app language', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('radio', { name: '繁體中文' }));

    expect(await screen.findByRole('heading', { name: '設定' })).toBeInTheDocument();
    expect(localStorage.getItem('language')).toBe('zh-Hant');
  });

  it('stores the chosen lyrics size', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('radio', { name: 'Largest' }));

    expect(screen.getByRole('radio', { name: 'Largest' })).toBeChecked();
    expect(localStorage.getItem('lyrics-size')).toBe('2xl');
    expect(previewOf()).toHaveAttribute('data-lyrics-size', '2xl');
  });

  it('applies the chosen accent colour and keeps it for next time', async () => {
    const stop = syncAccent();
    await renderPage();
    expect(screen.getByRole('radio', { name: 'Electric blue' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Signal orange' }));

    expect(document.documentElement.dataset.palette).toBe('signal');
    expect(localStorage.getItem('accent')).toBe('signal');
    stop();
  });

  it('stores the scroll speed and the keep-awake switch', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('radio', { name: 'Fast' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Keep screen awake' }));

    expect(localStorage.getItem('auto-scroll-speed')).toBe('fast');
    expect(localStorage.getItem('keep-awake')).toBe('off');
  });

  describe('preview', () => {
    it('draws the dummy chart in letters, full chords and the key of E', async () => {
      await renderPage();

      const preview = within(previewOf());
      expect(preview.getByText('Psalm 96')).toBeInTheDocument();
      expect(preview.getByText('B7')).toBeInTheDocument();
      expect(preview.getByText('C#m')).toBeInTheDocument();
      expect(preview.getByText('Large · A B C · full chords')).toBeInTheDocument();
    });

    it('shows chords as numbers when asked', async () => {
      await renderPage();

      await userEvent.click(screen.getByRole('radio', { name: 'Numbers' }));

      const preview = within(previewOf());
      expect(preview.getByText('1 = E')).toBeInTheDocument();
      expect(preview.queryByText('C#m')).not.toBeInTheDocument();
      expect(localStorage.getItem('chord-notation')).toBe('numbers');
    });

    it('drops the seventh for simple chords', async () => {
      await renderPage();

      await userEvent.click(screen.getByRole('radio', { name: /^Simple/ }));

      const preview = within(previewOf());
      expect(preview.queryByText('B7')).not.toBeInTheDocument();
      expect(preview.getByText(/simple chords/)).toBeInTheDocument();
      expect(localStorage.getItem('chord-style')).toBe('simple');
    });

    it('spells accidentals as flats when asked', async () => {
      await renderPage();

      await userEvent.click(screen.getByRole('radio', { name: 'Flats' }));

      expect(within(previewOf()).getByText('Dbm')).toBeInTheDocument();
      expect(localStorage.getItem('chord-accidentals')).toBe('flat');
    });

    it('colours the chords when the switch is on', async () => {
      await renderPage();

      await userEvent.click(screen.getByRole('switch', { name: 'Colour chords' }));

      expect(localStorage.getItem('chord-colour')).toBe('on');
      expect(within(previewOf()).getByText(/coloured/)).toBeInTheDocument();
    });

    it('is a single line, without the title, on a phone', async () => {
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }));
      await renderPage();

      const preview = within(previewOf());
      expect(preview.queryByText('Psalm 96')).not.toBeInTheDocument();
      expect(preview.getByText('Preview')).toBeInTheDocument();
      expect(preview.getAllByText('E')).not.toHaveLength(0);
    });
  });
});
