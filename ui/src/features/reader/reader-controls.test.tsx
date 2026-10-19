import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { LyricsColumns } from './lyrics-columns';
import { LyricsColumnsControl } from './reader-controls';

describe('LyricsColumnsControl', () => {
  it('names the current column count and steps to the next one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(columns: LyricsColumns) => void>();
    render(<LyricsColumnsControl columns="3" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Lyric columns: 3' }));

    expect(onChange).toHaveBeenCalledWith('1');
  });
});
