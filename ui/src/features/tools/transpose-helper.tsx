import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { KeyGrid } from '@/components/primitives/key-grid';
import { Textarea } from '@/components/ui/textarea';
import { conventionalKey, signedSemitones } from '@/features/chords/key-spelling';
import type { ChordNumber } from '@/features/chords/nashville';
import { ALL_KEY_ROOTS, keyLabel, type MusicKey } from '@/features/chords/theory';
import { chordsUseFlats, useAccidentals } from '@/features/reader/chord-display';

import {
  hasUnread,
  MAX_CHORD_TEXT,
  readChordRows,
  type TransposedToken,
  transposeRows,
} from './transpose';

const KEYS = ALL_KEY_ROOTS.map((root) => conventionalKey(root, false));
const FIRST_FROM = conventionalKey(7, false);
const FIRST_TO = conventionalKey(9, false);

function NumberLabel({ number }: { number: ChordNumber | null }) {
  if (!number) return null;
  return (
    <>
      {number.degree}
      {number.quality ? (
        <sup className="align-[0.5em] text-[0.68em] leading-none">{number.quality}</sup>
      ) : null}
      {number.bass === null ? null : `/${number.bass}`}
    </>
  );
}

function Token({ token }: { token: TransposedToken }) {
  const { t } = useTranslation();
  if (token.kind === 'chord') {
    return (
      <li className="bg-fill-hover flex min-h-16 min-w-12 flex-col items-center justify-center rounded-xl px-2.5">
        <b className="text-chord font-mono text-lg leading-tight">{token.letters}</b>
        <span className="text-ink-2 font-mono text-xs font-semibold">
          <NumberLabel number={token.number} />
        </span>
      </li>
    );
  }
  if (token.kind === 'bar') {
    return (
      <li aria-hidden className="text-ink-3 self-center px-0.5 font-mono text-lg">
        {token.typed}
      </li>
    );
  }
  return (
    <li className="border-hairline text-ink-3 flex min-h-16 min-w-12 flex-col items-center justify-center rounded-xl border border-dashed px-2.5">
      <s className="font-mono text-base">{token.typed}</s>
      <span className="text-[0.6875rem] font-semibold">{t('tools.transpose.unreadMark')}</span>
    </li>
  );
}

export function TransposeHelper() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [from, setFrom] = useState<MusicKey>(FIRST_FROM);
  const [to, setTo] = useState<MusicKey>(FIRST_TO);
  const [accidentals] = useAccidentals();
  const rows = readChordRows(text);
  const transposed = transposeRows(rows, from, to, chordsUseFlats(accidentals, to));
  const shift = signedSemitones(from, to);

  return (
    <div className="wide:max-w-[720px]">
      <GroupTitle first title={t('tools.transpose.chords')} />
      <Textarea
        aria-label={t('tools.transpose.chords')}
        value={text}
        maxLength={MAX_CHORD_TEXT}
        rows={3}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t('tools.transpose.placeholder')}
        onChange={(event) => setText(event.target.value)}
        className="font-mono"
      />
      <p className="text-ink-3 mt-2 px-1 text-[0.8125rem]">{t('tools.transpose.inputHint')}</p>
      <div className="wide:grid-cols-2 grid gap-x-8">
        <div>
          <GroupTitle title={t('tools.transpose.from')} first />
          <KeyGrid
            label={t('tools.transpose.from')}
            options={KEYS}
            selectedRoot={from.root}
            onSelect={setFrom}
            className="grid-cols-6"
          />
        </div>
        <div>
          <GroupTitle title={t('tools.transpose.to')} first />
          <KeyGrid
            label={t('tools.transpose.to')}
            options={KEYS}
            selectedRoot={to.root}
            onSelect={setTo}
            className="grid-cols-6"
          />
        </div>
      </div>
      <p className="text-ink-3 mt-2 px-1 text-[0.8125rem]">{t('tools.transpose.minorHint')}</p>
      <GroupTitle
        title={t('tools.transpose.result', { key: keyLabel(to) })}
        hint={
          shift === 0
            ? t('tools.transpose.sameKey')
            : t(shift > 0 ? 'tools.transpose.up' : 'tools.transpose.down', {
                count: Math.abs(shift),
              })
        }
      />
      {transposed.length === 0 ? (
        <p className="bg-fill-hover text-ink-2 m-0 rounded-2xl px-4 py-5 text-center text-sm">
          {t('tools.transpose.empty')}
        </p>
      ) : (
        <div className="grid gap-2">
          {transposed.map((row, index) => (
            <ol
              key={row.id}
              aria-label={t('tools.transpose.line', { number: index + 1 })}
              className="m-0 flex list-none flex-wrap gap-1.5 p-0"
            >
              {row.tokens.map((token) => (
                <Token key={token.id} token={token} />
              ))}
            </ol>
          ))}
          <p className="text-ink-3 m-0 px-1 text-[0.8125rem]">{t('tools.transpose.numbersHint')}</p>
          {hasUnread(rows) ? (
            <output className="text-ink-2 block px-1 text-[0.8125rem]">
              {t('tools.transpose.unreadHint')}
            </output>
          ) : null}
        </div>
      )}
    </div>
  );
}
