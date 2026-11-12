import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { TransposeHelper } from './transpose-helper';

const lineItems = (number: number) =>
  within(screen.getByRole('list', { name: `Line ${number}` }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

const pickKey = async (user: ReturnType<typeof userEvent.setup>, group: string, key: string) => {
  await user.click(
    within(screen.getByRole('group', { name: group })).getByRole('button', { name: key })
  );
};

describe('TransposeHelper', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('asks for chords until some are typed', () => {
    render(<TransposeHelper />);

    expect(screen.getByText('Type some chords to see them in the new key.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'From key' })).getByRole('button', { name: 'G' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(screen.getByRole('group', { name: 'To key' })).getByRole('button', { name: 'A' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('transposes typed chords and shows their numbers', async () => {
    const user = userEvent.setup();
    render(<TransposeHelper />);

    await user.type(screen.getByRole('textbox', { name: 'Chords to transpose' }), 'G D/F# Em7 C');

    expect(screen.getByRole('heading', { name: 'In A' })).toBeInTheDocument();
    expect(screen.getByText('Up 2 semitones')).toBeInTheDocument();
    expect(lineItems(1)).toEqual(['A1', 'E/G#5/7', 'F#m76m7', 'D4']);

    await pickKey(user, 'To key', 'F');

    expect(screen.getByText('Down 2 semitones')).toBeInTheDocument();
    expect(lineItems(1)).toEqual(['F1', 'C/E5/7', 'Dm76m7', 'Bb4']);
  });

  it('reads each line and the chords in brackets, and marks what it cannot read', async () => {
    const user = userEvent.setup();
    render(<TransposeHelper />);

    await user.click(screen.getByRole('textbox', { name: 'Chords to transpose' }));
    await user.paste('[G]Amazing [C]grace [x2]\n| D hello |');

    expect(lineItems(1)).toEqual(['A1', 'D4', 'x2not a chord']);
    expect(lineItems(2)).toEqual(['E5', 'hellonot a chord']);
    expect(screen.getByRole('status')).toHaveTextContent('kept as typed');
  });

  it('follows the sharps and flats setting from the reader', async () => {
    localStorage.setItem('chord-accidentals', 'flat');
    const user = userEvent.setup();
    render(<TransposeHelper />);

    await user.type(screen.getByRole('textbox', { name: 'Chords to transpose' }), 'G D/F# Em');

    expect(lineItems(1)).toEqual(['A1', 'E/Ab5/7', 'Gbm6m']);
  });

  it('says when both keys are the same', async () => {
    const user = userEvent.setup();
    render(<TransposeHelper />);

    await pickKey(user, 'To key', 'G');

    expect(screen.getByText('Same key')).toBeInTheDocument();
  });
});
