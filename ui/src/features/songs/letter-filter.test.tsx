import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LetterFilter } from './letter-filter';
import type { LetterFilter as LetterFilterValue } from './song-groups';

describe('LetterFilter', () => {
  it('offers A to Z and #, marking the picked letter', () => {
    render(
      <LetterFilter value="C" onChange={vi.fn<(letter: LetterFilterValue | undefined) => void>()} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(27);
    expect(screen.getByRole('button', { name: /starting with C/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /starting with D/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('picks a letter and clears it when picked again', async () => {
    const onChange = vi.fn<(letter: LetterFilterValue | undefined) => void>();
    const { rerender } = render(<LetterFilter value={undefined} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /starting with B/i }));
    expect(onChange).toHaveBeenLastCalledWith('B');

    rerender(<LetterFilter value="B" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /starting with B/i }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('picks # for titles that start with another character', async () => {
    const onChange = vi.fn<(letter: LetterFilterValue | undefined) => void>();
    render(<LetterFilter value={undefined} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /other characters/i }));
    expect(onChange).toHaveBeenLastCalledWith('#');
  });
});
