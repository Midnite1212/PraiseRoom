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

  it('drops sections without lyrics in lyrics mode and keeps them in chords mode', () => {
    const chordLyrics = `{Intro}\n[G] [C]\n${LYRICS}\n{Interlude}\n[D]`;
    const props = { chordLyrics, notation: 'letters', originalKey: G, playKey: G } as const;
    const { rerender } = render(<LyricsSheet {...props} mode="lyrics" />);

    expect(screen.queryByRole('heading', { name: 'Intro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Interlude' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verse 1' })).toBeInTheDocument();

    rerender(<LyricsSheet {...props} mode="chords" />);

    expect(screen.getByRole('heading', { name: 'Intro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Interlude' })).toBeInTheDocument();
  });

  it('shows a repeated section once in chords view and gives each block an id', () => {
    const repeated = `${LYRICS}\n{Chorus}\n[Em7]O Lord of my [D/F#]heart`;
    const { rerender } = render(
      <LyricsSheet
        chordLyrics={repeated}
        mode="chords"
        notation="letters"
        originalKey={G}
        playKey={G}
        repeats="once"
        sectionIdPrefix="song-title"
      />
    );
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(1);
    expect(document.getElementById('song-title-s1')).not.toBeNull();

    rerender(
      <LyricsSheet
        chordLyrics={repeated}
        mode="lyrics"
        notation="letters"
        originalKey={G}
        playKey={G}
        repeats="once"
      />
    );
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(2);
  });

  it('shows a lead-in chord over the first word and drops the space in lyrics view', () => {
    const { container, rerender } = render(
      <LyricsSheet
        chordLyrics="[G] Holy is the Lord"
        mode="chords"
        notation="letters"
        originalKey={G}
        playKey={G}
      />
    );
    const first = container.querySelector('p > span');
    expect(first?.textContent).toBe('GHoly ');

    rerender(
      <LyricsSheet
        chordLyrics="[G] Holy is the Lord"
        mode="lyrics"
        notation="letters"
        originalKey={G}
        playKey={G}
      />
    );
    expect(container.querySelector('p')?.textContent).toBe('Holy is the Lord');
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

  it('colours chords by degree against the original key, through transposing and Simple chords', () => {
    render(
      <LyricsSheet
        chordLyrics={'[G]one [C]two [D7]three [Em7]four [F]five'}
        mode="chords"
        notation="letters"
        chordStyle="simple"
        colourChords
        originalKey={G}
        playKey={A}
      />
    );

    expect(screen.getByText('A')).toHaveClass('text-chord');
    expect(screen.getByText('D')).toHaveClass('text-chord-four');
    expect(screen.getByText('E')).toHaveClass('text-chord-five');
    expect(screen.getByText('F#m')).toHaveClass('text-chord-minor');
    expect(screen.getByText('G')).toHaveClass('text-ink-2');
  });

  it('colours Nashville numbers the same way and leaves chords in the accent when off', () => {
    const { rerender } = render(
      <LyricsSheet
        chordLyrics={'[G]one [C]two'}
        mode="chords"
        notation="numbers"
        colourChords
        originalKey={G}
        playKey={A}
      />
    );
    expect(screen.getByText('4')).toHaveClass('text-chord-four');

    rerender(
      <LyricsSheet
        chordLyrics={'[G]one [C]two'}
        mode="chords"
        notation="numbers"
        originalKey={G}
        playKey={A}
      />
    );
    expect(screen.getByText('4')).toHaveClass('text-chord');
  });

  it('shows the shapes to play with a capo, after transposing', () => {
    render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="letters"
        originalKey={G}
        playKey={A}
        capo={2}
      />
    );

    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('Em7')).toBeInTheDocument();
    expect(screen.getByText('D/F#')).toBeInTheDocument();
  });

  it('spells capo shapes by the shape key and honours Simple chords', () => {
    render(
      <LyricsSheet
        chordLyrics="[Dm7]Hold [Gsus4]on"
        mode="chords"
        notation="letters"
        chordStyle="simple"
        originalKey={parseKey('Dm')}
        playKey={parseKey('Dm')}
        capo={3}
      />
    );

    expect(screen.getByText('Bm')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('leaves numbers unchanged by a capo', () => {
    const { container } = render(
      <LyricsSheet
        chordLyrics={LYRICS}
        mode="chords"
        notation="numbers"
        originalKey={G}
        playKey={A}
        capo={2}
      />
    );

    expect(container).toHaveTextContent('1');
    expect(container).toHaveTextContent('4');
  });
});
