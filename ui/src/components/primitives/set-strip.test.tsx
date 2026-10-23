import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SetStrip } from './set-strip';

describe('SetStrip', () => {
  it('names the songs and draws one square for each, even for repeated titles', () => {
    const { container } = render(<SetStrip status="next" titles={['Alpha', 'Beta', 'Alpha']} />);
    expect(screen.getByText('3 songs: Alpha, Beta, Alpha')).toBeInTheDocument();
    expect(container.querySelectorAll('i')).toHaveLength(3);
  });

  it('says so when the set has no songs', () => {
    render(<SetStrip status="up" titles={[]} />);
    expect(screen.getByText('No songs yet')).toBeInTheDocument();
  });
});
