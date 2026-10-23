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

  it('respells transposed chords when sharps or flats are forced', () => {
    const { rerender } = render(
      <LyricsSheet
        chordLyrics="[A]Line [D/F#]two"
        mode="chords"
        notation="letters"
        accidentals="flat"
        originalKey={A}
        playKey={A}
      />
    );
    expect(screen.getByText('D/Gb')).toBeInTheDocument();

    rerender(
      <LyricsSheet
        chordLyrics="[Bb]Line [Eb/G]two"
        mode="chords"
        notation="letters"
        accidentals="sharp"
        originalKey={parseKey('Bb')}
        playKey={parseKey('Bb')}
      />
    );
    expect(screen.getByText('A#')).toBeInTheDocument();
    expect(screen.getByText('D#/G')).toBeInTheDocument();
  });

  it('simplifies after transposing and spelling, in letters', () => {
    render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="letters"
        chordStyle="simple"
        accidentals="flat"
        originalKey={G}
        playKey={A}
      />
    );

    expect(screen.getByText('Gbm')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.queryByText('Gbm7')).not.toBeInTheDocument();
    expect(screen.queryByText('E/Ab')).not.toBeInTheDocument();
  });

  it('simplifies in numbers, with no raised extension or bass', () => {
    const { container } = render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="numbers"
        chordStyle="simple"
        originalKey={G}
        playKey={A}
      />
    );

    expect(container.querySelector('sup')).toBeNull();
    expect(screen.getByText('6m')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('5/7', { exact: false })).not.toBeInTheDocument();
  });
});
