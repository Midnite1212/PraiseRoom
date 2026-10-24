import { useReaderMode } from './chord-display';
import { ReaderModeToggle } from './reader-controls';

// The top row's Lyrics | Chords.
export function ReaderModes() {
  const [mode, setMode] = useReaderMode();
  return <ReaderModeToggle mode={mode} onChange={setMode} />;
}
