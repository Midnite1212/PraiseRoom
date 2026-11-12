import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { KeyGrid } from '@/components/primitives/key-grid';
import { classifyChord } from '@/features/chords/chord-class';
import { conventionalKey } from '@/features/chords/key-spelling';
import { ALL_KEY_ROOTS, keyLabel, type MusicKey } from '@/features/chords/theory';
import { useColourChords } from '@/features/reader/chord-display';
import { CHORD_CLASS_COLOURS } from '@/features/reader/lyrics-sheet';

import { type ChordCard, ChordCards } from './chord-cards';
import {
  buildProgression,
  chordsInKey,
  type KeyChord,
  PROGRESSIONS,
  progressionName,
} from './key-chords';

const KEYS = ALL_KEY_ROOTS.map((root) => conventionalKey(root, false));
const FIRST_KEY = conventionalKey(0, false);

export function KeyGuide() {
  const { t } = useTranslation();
  const [key, setKey] = useState<MusicKey>(FIRST_KEY);
  const [colourChords] = useColourChords();
  const name = keyLabel(key);
  const toCard = (chord: KeyChord): ChordCard => ({
    name: chord.name,
    caption: chord.number,
    nameClassName:
      colourChords === 'on' ? CHORD_CLASS_COLOURS[classifyChord(chord.name, key)] : undefined,
  });

  return (
    <>
      <KeyGrid
        label={t('tools.keys.pick')}
        options={KEYS}
        selectedRoot={key.root}
        onSelect={setKey}
        className="wide:grid-cols-12 grid-cols-6"
      />
      <GroupTitle first title={t('tools.keys.chordsIn', { key: name })} />
      <ChordCards
        chords={chordsInKey(key).map(toCard)}
        label={t('tools.keys.chordsIn', { key: name })}
      />
      <GroupTitle title={t('tools.keys.progressions')} />
      <div className="wide:flex wide:flex-wrap wide:gap-x-10 grid gap-y-5">
        {PROGRESSIONS.map(({ id, degrees }) => {
          const chords = buildProgression(key, degrees);
          const numerals = progressionName(chords);
          return (
            <section key={id} aria-label={numerals}>
              <h3 className="text-ink m-0 mb-2 px-1 font-mono text-sm font-bold">{numerals}</h3>
              <ChordCards
                chords={chords.map(toCard)}
                label={t('tools.keys.progressionIn', { progression: numerals, key: name })}
              />
            </section>
          );
        })}
      </div>
    </>
  );
}
