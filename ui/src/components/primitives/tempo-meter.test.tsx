import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TempoMeter, tempoLevel } from './tempo-meter';

describe('tempoLevel', () => {
  it('maps Slow to Fast onto 1 to 4', () => {
    expect(tempoLevel(['Slow'])).toBe(1);
    expect(tempoLevel(['Medium Slow'])).toBe(2);
    expect(tempoLevel(['Medium'])).toBe(3);
    expect(tempoLevel(['Fast'])).toBe(4);
  });

  it('takes the fastest of several and ignores unknown names', () => {
    expect(tempoLevel(['Slow', 'Medium'])).toBe(3);
    expect(tempoLevel(['Brisk'])).toBe(0);
    expect(tempoLevel([])).toBe(0);
  });
});

describe('TempoMeter', () => {
  it('is labelled with the tempo name', () => {
    render(<TempoMeter tempo={['Medium Slow']} />);
    expect(screen.getByText('Tempo: Medium slow')).toBeInTheDocument();
  });

  it('renders nothing without a known tempo', () => {
    const { container } = render(<TempoMeter tempo={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
