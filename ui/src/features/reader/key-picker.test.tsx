import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';
import type { MusicKey } from '@/features/chords/theory';

import { KeyPicker } from './key-picker';

const ORIGINAL = conventionalKey(7, false);
const PLAY = conventionalKey(1, false);

const renderPicker = (props: { playKey?: MusicKey; capo?: number }) => {
  const onChange = vi.fn<(key: MusicKey) => void>();
  const onCapoChange = vi.fn<(capo: number | null) => void>();
  render(
    <KeyPicker
      originalKey={ORIGINAL}
      playKey={props.playKey ?? PLAY}
      onChange={onChange}
      capo={props.capo ?? 0}
      onCapoChange={onCapoChange}
    />
  );
  return { onChange, onCapoChange };
};

describe('KeyPicker tray', () => {
  afterEach(() => localStorage.clear());

  it('opens a dialog without a scrim, with the key note, Show chords as and the capo stepper', async () => {
    const user = userEvent.setup();
    renderPicker({});
    await user.click(screen.getByRole('button', { name: /^Key/ }));

    expect(screen.getByRole('dialog', { name: 'Key' })).toBeInTheDocument();
    expect(screen.getByText('+6 from the original G')).toBeInTheDocument();
    expect(screen.getByText('Show chords as')).toBeInTheDocument();
    expect(screen.getByText('No capo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Numbers' }));
    expect(localStorage.getItem('chord-notation')).toBe('numbers');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderPicker({});
    await user.click(screen.getByRole('button', { name: /^Key/ }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('steps the capo, names the shapes to play, and shows the capo on the pill', async () => {
    const user = userEvent.setup();
    const { onCapoChange } = renderPicker({ capo: 4 });
    expect(screen.getByRole('button', { name: /^Key/ })).toHaveTextContent('Capo 4');
    await user.click(screen.getByRole('button', { name: /^Key/ }));

    expect(screen.getByText('Play A shapes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Capo up' }));
    expect(onCapoChange).toHaveBeenCalledWith(5);
    await user.click(screen.getByRole('button', { name: 'Capo down' }));
    expect(onCapoChange).toHaveBeenCalledWith(3);
  });

  it('resets the key and the capo together', async () => {
    const user = userEvent.setup();
    const { onChange, onCapoChange } = renderPicker({ playKey: ORIGINAL, capo: 2 });
    await user.click(screen.getByRole('button', { name: /^Key/ }));
    await user.click(screen.getByRole('button', { name: 'Reset to G' }));

    expect(onChange).toHaveBeenCalledWith(ORIGINAL);
    expect(onCapoChange).toHaveBeenCalledWith(null);
  });

  it('hides the reset link with no offset and no capo', async () => {
    const user = userEvent.setup();
    renderPicker({ playKey: ORIGINAL, capo: 0 });
    await user.click(screen.getByRole('button', { name: /^Key/ }));

    expect(screen.queryByRole('button', { name: 'Reset to G' })).not.toBeInTheDocument();
  });
});
