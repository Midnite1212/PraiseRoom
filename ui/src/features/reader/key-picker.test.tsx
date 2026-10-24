import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';
import type { MusicKey } from '@/features/chords/theory';

import { KeyPicker } from './key-picker';

const ORIGINAL = conventionalKey(7, false);
const PLAY = conventionalKey(1, false);

describe('KeyPicker capo', () => {
  afterEach(() => localStorage.clear());

  it('has no capo row or pill note while the Guitar capo switch is off', async () => {
    const user = userEvent.setup();
    render(
      <KeyPicker
        originalKey={ORIGINAL}
        playKey={PLAY}
        onChange={vi.fn<(key: MusicKey) => void>()}
        capo={2}
        onCapoChange={vi.fn<(capo: number) => void>()}
      />
    );
    await user.click(screen.getByRole('button', { name: /^Key/ }));

    expect(screen.queryByText('Capo')).not.toBeInTheDocument();
    expect(screen.queryByText('Capo 2')).not.toBeInTheDocument();
  });

  it('steps the capo, names the shapes to play, and shows the capo on the pill', async () => {
    localStorage.setItem('guitar-capo', 'on');
    const user = userEvent.setup();
    const onCapoChange = vi.fn<(capo: number) => void>();
    render(
      <KeyPicker
        originalKey={ORIGINAL}
        playKey={PLAY}
        onChange={vi.fn<(key: MusicKey) => void>()}
        capo={4}
        onCapoChange={onCapoChange}
      />
    );
    expect(screen.getByRole('button', { name: /^Key/ })).toHaveTextContent('Capo 4');
    await user.click(screen.getByRole('button', { name: /^Key/ }));

    expect(screen.getByText('Play A shapes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Capo up' }));
    expect(onCapoChange).toHaveBeenCalledWith(5);
    await user.click(screen.getByRole('button', { name: 'Capo down' }));
    expect(onCapoChange).toHaveBeenCalledWith(3);
  });

  it('says No capo at fret 0 and resets the capo with the key', async () => {
    localStorage.setItem('guitar-capo', 'on');
    const user = userEvent.setup();
    const onChange = vi.fn<(key: MusicKey) => void>();
    const onCapoChange = vi.fn<(capo: number) => void>();
    render(
      <KeyPicker
        originalKey={ORIGINAL}
        playKey={ORIGINAL}
        onChange={onChange}
        capo={2}
        onCapoChange={onCapoChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /^Key/ }));
    await user.click(screen.getByRole('button', { name: 'Reset to G' }));

    expect(onChange).toHaveBeenCalledWith(ORIGINAL);
    expect(onCapoChange).toHaveBeenCalledWith(0);
  });
});
