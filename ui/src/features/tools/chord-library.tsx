import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { KeyGrid } from '@/components/primitives/key-grid';
import { conventionalKey } from '@/features/chords/key-spelling';
import { ALL_KEY_ROOTS, keyLabel, parseChord } from '@/features/chords/theory';

import { ChordCards } from './chord-cards';
import { searchChords } from './chord-search';

const ROOTS = ALL_KEY_ROOTS.map((root) => conventionalKey(root, false));

const MAX_QUERY_LENGTH = 24;

const sharedRoot = (chords: string[]): number | undefined => {
  const roots = new Set(chords.map((chord) => parseChord(chord)?.root));
  const [root] = roots;
  return roots.size === 1 ? root : undefined;
};

export function ChordLibrary() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const isSearching = query.trim() !== '';
  const chords = searchChords(query);

  return (
    <>
      <Finder
        value={query}
        onChange={setQuery}
        placeholder={t('tools.chords.searchPlaceholder')}
        label={t('tools.chords.search')}
        maxLength={MAX_QUERY_LENGTH}
      />
      <KeyGrid
        label={t('tools.chords.root')}
        options={ROOTS}
        selectedRoot={sharedRoot(chords)}
        onSelect={(root) => setQuery(keyLabel(root))}
        className="wide:grid-cols-12 mt-3 grid-cols-6"
      />
      <GroupTitle
        first
        title={t(isSearching ? 'tools.chords.results' : 'tools.chords.browse')}
        count={chords.length}
      />
      {chords.length > 0 ? (
        <ChordCards
          chords={chords.map((name) => ({ name }))}
          label={t(isSearching ? 'tools.chords.results' : 'tools.chords.browse')}
        />
      ) : (
        <EmptyState
          title={t('tools.chords.none', { query: query.trim() })}
          onClearSearch={() => setQuery('')}
        >
          {t('tools.chords.noneHint')}
        </EmptyState>
      )}
    </>
  );
}
