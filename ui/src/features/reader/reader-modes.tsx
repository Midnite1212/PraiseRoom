import { useIsWide } from '@/hooks/use-wide';

import { useChordNotation, useReaderMode } from './chord-display';
import { ChordNotationToggle, ReaderModeToggle } from './reader-controls';

// The top row's Lyrics | Chords, and on wide screens with chords on, the 1 4 5 | A B C toggle beside it.
export function ReaderModes() {
  const isWide = useIsWide();
  const [mode, setMode] = useReaderMode();
  const [notation, setNotation] = useChordNotation();
  return (
    <>
      <ReaderModeToggle mode={mode} onChange={setMode} />
      {isWide && mode === 'chords' ? (
        <ChordNotationToggle notation={notation} onChange={setNotation} glass />
      ) : null}
    </>
  );
}
