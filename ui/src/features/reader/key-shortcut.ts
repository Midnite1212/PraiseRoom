import { conventionalKey } from '@/features/chords/key-spelling';
import { type MusicKey, noteIndex } from '@/features/chords/theory';

const NOTE_LETTER = /^[A-Ga-g]$/;

// A letter A–G jumps to that tonic, a plus or equals sign moves up a semitone and a minus down. The mode
// (major or minor) always stays the song's own, as in the key picker.
export const keyForShortcut = (
  pressed: string,
  originalKey: MusicKey,
  playKey: MusicKey
): MusicKey | null => {
  if (NOTE_LETTER.test(pressed)) {
    const root = noteIndex(pressed);
    return root === null ? null : conventionalKey(root, originalKey.isMinor);
  }
  if (pressed === '+' || pressed === '=') {
    return conventionalKey(playKey.root + 1, originalKey.isMinor);
  }
  if (pressed === '-') return conventionalKey(playKey.root - 1, originalKey.isMinor);
  return null;
};
