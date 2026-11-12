import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { KeyGrid } from '@/components/primitives/key-grid';
import { Segmented } from '@/components/primitives/segmented';
import { SetRow } from '@/components/primitives/set-row';
import { Stepper } from '@/components/primitives/stepper';
import { conventionalKey } from '@/features/chords/key-spelling';
import { ALL_KEY_ROOTS, keyLabel, type MusicKey } from '@/features/chords/theory';
import { MAX_CAPO } from '@/features/reader/chord-display';

import { capoForShapes, soundingKey } from './capo';

const KEYS = ALL_KEY_ROOTS.map((root) => conventionalKey(root, false));
const FIRST_SONG_KEY = conventionalKey(10, false);
const FIRST_SHAPES = conventionalKey(7, false);
const FIRST_CAPO = 3;

const CAPO_MODES = ['capo', 'key'] as const;
type CapoMode = (typeof CAPO_MODES)[number];

function Answer({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <output className="bg-fill-hover mt-6 block rounded-2xl px-4 py-4 text-center">
      <span className="text-ink-3 block text-xs font-semibold">{label}</span>
      <b className="text-chord mt-1 block font-mono text-4xl leading-none font-bold">{value}</b>
      <span className="text-ink-2 mt-2 block text-sm text-balance">{note}</span>
    </output>
  );
}

export function CapoHelper() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CapoMode>('capo');
  const [songKey, setSongKey] = useState<MusicKey>(FIRST_SONG_KEY);
  const [shapes, setShapes] = useState<MusicKey>(FIRST_SHAPES);
  const [capo, setCapo] = useState(FIRST_CAPO);
  const shapesName = keyLabel(shapes);
  const fret = capoForShapes(songKey, shapes);
  const heard = keyLabel(soundingKey(shapes, capo));

  return (
    <div className="wide:max-w-[720px]">
      <Segmented
        value={mode}
        onChange={setMode}
        label={t('tools.capo.mode')}
        className="wide:w-auto w-full"
        options={[
          { value: 'capo', label: t('tools.capo.findCapo') },
          { value: 'key', label: t('tools.capo.findKey') },
        ]}
      />
      {mode === 'capo' ? (
        <>
          <div className="wide:grid-cols-2 grid gap-x-8">
            <div>
              <GroupTitle first title={t('tools.capo.songKey')} />
              <KeyGrid
                label={t('tools.capo.songKey')}
                options={KEYS}
                selectedRoot={songKey.root}
                onSelect={setSongKey}
                className="grid-cols-6"
              />
            </div>
            <div>
              <GroupTitle first title={t('tools.capo.shapes')} />
              <KeyGrid
                label={t('tools.capo.shapes')}
                options={KEYS}
                selectedRoot={shapes.root}
                onSelect={setShapes}
                className="grid-cols-6"
              />
            </div>
          </div>
          <Answer
            label={t('reader.capo')}
            value={fret === 0 ? t('reader.noCapo') : t('tools.capo.fret', { fret })}
            note={
              fret === 0
                ? t('tools.capo.noCapoNote', { shapes: shapesName, key: keyLabel(songKey) })
                : fret > MAX_CAPO
                  ? t('tools.capo.highNote', { fret })
                  : t('tools.capo.capoNote', { shapes: shapesName, fret, key: keyLabel(songKey) })
            }
          />
        </>
      ) : (
        <>
          <GroupTitle first title={t('tools.capo.shapes')} />
          <KeyGrid
            label={t('tools.capo.shapes')}
            options={KEYS}
            selectedRoot={shapes.root}
            onSelect={setShapes}
            className="grid-cols-6"
          />
          <SetRow
            label={t('reader.capo')}
            hint={capo === 0 ? t('reader.noCapo') : undefined}
            className="mt-3"
          >
            <Stepper
              value={capo}
              decreaseLabel={t('reader.capoDown')}
              increaseLabel={t('reader.capoUp')}
              canDecrease={capo > 0}
              canIncrease={capo < MAX_CAPO}
              onDecrease={() => setCapo(capo - 1)}
              onIncrease={() => setCapo(capo + 1)}
            />
          </SetRow>
          <Answer
            label={t('tools.capo.keyAnswer')}
            value={heard}
            note={
              capo === 0
                ? t('tools.capo.noCapoNote', { shapes: shapesName, key: heard })
                : t('tools.capo.keyNote', { shapes: shapesName, fret: capo, key: heard })
            }
          />
        </>
      )}
    </div>
  );
}
