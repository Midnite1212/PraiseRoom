import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import { LyricsSheet } from './lyrics-sheet';

const LYRICS = '{Verse 1}\n[G]Be Thou my [C]vision\n{Chorus}\n[Em7]O Lord of my [D/F#]heart';
const G = parseKey('G');
const A = parseKey('A');

describe('LyricsSheet', () => {
  it('shows transposed letter chords above the lyrics with section labels', () => {
    render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="letters"
        originalKey={G}
        playKey={A}
      />
    );

    expect(screen.getByRole('heading', { name: 'Verse 1' })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('F#m7')).toBeInTheDocument();
    expect(screen.getByText('E/G#')).toBeInTheDocument();
    expect(screen.getByText('vision')).toBeInTheDocument();
  });

  it('shows Nashville numbers relative to the original key, raising extensions', () => {
    const { container } = render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="numbers"
        originalKey={G}
        playKey={A}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(container.querySelector('sup')?.textContent).toBe('7');
    expect(screen.getByText('6m', { exact: false })).toBeInTheDocument();
  });

  it('hides chords in lyrics mode and joins each line back into plain text', () => {
    render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="lyrics"
        notation="letters"
        originalKey={G}
        playKey={A}
      />
    );

    expect(screen.getByText('Be Thou my vision')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('keeps the lyrics size class alongside the column classes', () => {
    const { container } = render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="letters"
        originalKey={G}
        playKey={A}
        columns="3"
      />
    );
    const sheet = container.firstElementChild;
    expect(sheet).toHaveClass('text-lyrics', 'text-sheet-foreground', 'columns-3');
  });
});
