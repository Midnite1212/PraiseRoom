import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { syncTypeface } from '@/lib/typeface';

import { SettingsPage } from './settings-page';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.typeface;
});

describe('SettingsPage', () => {
  it('selects Geist and medium by default', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('radio', { name: /Geist/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
  });

  it('applies the chosen font to the app and keeps it for next time', async () => {
    const stop = syncTypeface();
    render(<SettingsPage />);

    await userEvent.click(screen.getByRole('radio', { name: /Pixel/ }));

    expect(screen.getByRole('radio', { name: /Pixel/ })).toBeChecked();
    expect(document.documentElement.dataset.typeface).toBe('pixel');
    expect(localStorage.getItem('typeface')).toBe('pixel');
    stop();
  });

  it('stores the chosen lyrics size', async () => {
    render(<SettingsPage />);

    await userEvent.click(screen.getByRole('radio', { name: 'Largest' }));

    expect(screen.getByRole('radio', { name: 'Largest' })).toBeChecked();
    expect(localStorage.getItem('lyrics-size')).toBe('2xl');
  });
});
