import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import { TapLine } from './song-sections';

const renderLine = (raw: string) => {
  const musicKey = parseKey('G');
  if (!musicKey) throw new Error('G should parse');
  render(
    <TapLine
      raw={raw}
      musicKey={musicKey}
      picking={null}
      onPickingChange={vi.fn<(start: number | null) => void>()}
      onChord={vi.fn<(wordStart: number, chord: string | null) => void>()}
    />
  );
};

describe('TapLine', () => {
  it('keeps an empty lead-in slot in the gutter', () => {
    renderLine('Lift up');
    expect(screen.getByRole('button', { name: 'Add a chord before the line' })).toHaveClass(
      'absolute'
    );
  });

  it('lays out lead-in chords inline so a long run stays inside the line', () => {
    renderLine('[G] [D/F#] [Em] [C] x2');
    const lead = screen.getByRole('button', { name: /before the line/ });
    expect(lead).toHaveTextContent('G D/F# Em C');
    expect(lead).not.toHaveClass('absolute');
  });
});
