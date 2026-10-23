import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ChordSettingsPanel } from './chord-settings';

describe('ChordSettingsPanel', () => {
  afterEach(() => localStorage.clear());

  it('stores the sharps and flats choice and the notation choice', async () => {
    const user = userEvent.setup();
    render(<ChordSettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'Chord settings' }));

    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Flats' }));
    expect(screen.getByRole('radio', { name: 'Flats' })).toBeChecked();
    expect(localStorage.getItem('chord-accidentals')).toBe('flat');

    expect(screen.getByRole('radio', { name: 'Full' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Simple' }));
    expect(localStorage.getItem('chord-style')).toBe('simple');

    await user.click(screen.getByRole('radio', { name: 'Numbers' }));
    expect(localStorage.getItem('chord-notation')).toBe('numbers');
  });
});
