import { Link } from '@tanstack/react-router';
import { ExternalLink, Users } from 'pixelarticons/react';
import { useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/app-shell';
import { type ActiveFilter, FilterChips } from '@/components/page/filter-chips';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES, LIST_COMPACT_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { useSlideOver } from '@/components/page/slide-over';
import { nextSetlistId, setStatus } from '@/components/primitives/set-status';
import { tempoLevel } from '@/components/primitives/tempo-meter';
import { Button } from '@/components/ui/button';
import { type MusicKey, parseKey } from '@/features/chords/theory';
import { FolderDetail } from '@/features/folders/folder-detail';
import { useAutoScroll } from '@/features/reader/auto-scroll';
import { AutoScrollButton } from '@/features/reader/auto-scroll-controls';
import { useChordNotation, useReaderMode } from '@/features/reader/chord-display';
import { KeyPicker } from '@/features/reader/key-picker';
import { toPresentSong } from '@/features/reader/present-slides';
import { ReaderBack } from '@/features/reader/reader-back';
import {
  ChordNotationToggle,
  ReadingPanel,
  WideReadingControls,
} from '@/features/reader/reader-controls';
import { ReaderLayout } from '@/features/reader/reader-layout';
import { ReaderModes } from '@/features/reader/reader-modes';
import { ReadingSettings } from '@/features/reader/reading-settings';
import { useSongCapo } from '@/features/reader/song-capo';
import { SongReader } from '@/features/reader/song-reader';
import { useKeyShortcuts } from '@/features/reader/use-key-shortcuts';
import { filterSetlists, groupSetlists, type SetlistOwnership } from '@/features/setlists/list';
import { MusicianView } from '@/features/setlists/musician-view/musician-view';
import { NextSetCard } from '@/features/setlists/next-set-card';
import { SetlistCalendar } from '@/features/setlists/setlist-calendar';
import { SetlistFilterSheet } from '@/features/setlists/setlist-filter-sheet';
import { SetlistListContext } from '@/features/setlists/setlist-list-context';
import { SetlistPreview } from '@/features/setlists/setlist-preview';
import { ManagedSetlistRow, SetlistRow } from '@/features/setlists/setlist-row';
import { useSetlistNames } from '@/features/setlists/use-setlist-names';
import {
  type SongSort,
  type SongSummary,
  type SortDirection,
  TEMPO_LABEL_KEYS,
  TEMPO_OPTIONS,
  type Song,
} from '@/features/songs/api';
import { type KeyFilterOption, tonicOf } from '@/features/songs/key-options';
import { nextSetSongIds } from '@/features/songs/next-set';
import { type SongFilterValues, SongFilterSheet } from '@/features/songs/song-filter-sheet';
import { SongPreview } from '@/features/songs/song-preview';
import { SongRows } from '@/features/songs/song-rows';
import { SongsTable } from '@/features/songs/songs-table';
import { useIsWide } from '@/hooks/use-wide';
import i18n, { LANGUAGES } from '@/i18n';
import { dateLocale } from '@/lib/date-locale';
import { cn } from '@/lib/utils';

import {
  DEMO_FOLDER_KEY,
  DEMO_SETLIST_KEY,
  demoFolder,
  demoPeople,
  demoSession,
  demoSetlists,
  demoSongs,
  matchesDemoSearch,
  toSetlistSummary,
  toSongSummary,
} from './demo-data';
import type { PreviewScreen } from './screens';

const isTempo = (value: string): value is (typeof TEMPO_OPTIONS)[number] =>
  TEMPO_OPTIONS.some((option) => option === value);

const SORT_VALUES: Record<SongSort, (song: SongSummary) => string | number> = {
  title: (song) => song.title.toLocaleLowerCase(),
  key: (song) => parseKey(song.originalKey)?.root ?? 0,
  tempo: (song) => tempoLevel(song.tempo),
  code: (song) => song.code ?? '',
};

const sortSongs = (songs: readonly SongSummary[], sort: SongSort, dir: SortDirection) => {
  const value = SORT_VALUES[sort];
  const direction = dir === 'asc' ? 1 : -1;
  return songs.toSorted((a, b) => {
    const left = value(a);
    const right = value(b);
    return left === right ? 0 : (left < right ? -1 : 1) * direction;
  });
};

function LibraryScreen({ now }: { now: number }) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const session = demoSession(t);
  const songs = demoSongs(t).map(toSongSummary);
  const [text, setText] = useState('');
  const [filters, setFilters] = useState<SongFilterValues>({
    tempo: [],
    themes: [],
    keys: [],
    web: false,
    sort: 'title',
    dir: 'asc',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { tempo, themes, keys, sort, dir } = filters;
  const changeFilters = (next: Partial<SongFilterValues>) =>
    setFilters((current) => ({ ...current, ...next }));

  const hasKey = (song: SongSummary) => {
    const tonic: KeyFilterOption | null = tonicOf(song.originalKey);
    return keys.length === 0 || (tonic !== null && keys.includes(tonic));
  };
  const visible = sortSongs(
    songs.filter(
      (song) =>
        matchesDemoSearch(song, text) &&
        (tempo.length === 0 || song.tempo.some((value) => tempo.includes(value))) &&
        (themes.length === 0 || song.themes.some((value) => themes.includes(value))) &&
        hasKey(song)
    ),
    sort,
    dir
  );
  const activeFilters: ActiveFilter[] = [
    ...tempo.map((value) => ({
      key: `tempo-${value}`,
      label: isTempo(value) ? t(TEMPO_LABEL_KEYS[value]) : value,
      onRemove: () => changeFilters({ tempo: tempo.filter((item) => item !== value) }),
    })),
    ...themes.map((value) => ({
      key: `theme-${value}`,
      label: value,
      onRemove: () => changeFilters({ themes: themes.filter((item) => item !== value) }),
    })),
    ...keys.map((value) => ({
      key: `key-${value}`,
      label: t('songs.filters.keyChip', { key: value }),
      onRemove: () => changeFilters({ keys: keys.filter((item) => item !== value) }),
    })),
  ];
  const isFiltered = text.trim() !== '' || activeFilters.length > 0;
  const clearSearch = text === '' ? undefined : () => setText('');
  const clearFilters =
    activeFilters.length === 0
      ? undefined
      : () => changeFilters({ tempo: [], themes: [], keys: [] });
  const selectedSong = isWide ? visible.find((song) => song._id === selectedId) : undefined;
  const slideOver = useSlideOver(selectedSong !== undefined, () => setSelectedId(undefined));
  const setlists = demoSetlists(t, now).map(toSetlistSummary);

  return (
    <AppShell session={session}>
      <PageHeader title={t('songs.title')} />
      <div
        className={cn(
          selectedSong &&
            'roomy:grid roomy:grid-cols-[minmax(0,1fr)_25rem] roomy:items-start roomy:gap-10'
        )}
      >
        <div className="min-w-0">
          <Finder
            value={text}
            onChange={setText}
            placeholder={t(isWide ? 'songs.searchWide' : 'songs.searchPhone', {
              total: songs.length,
            })}
            label={t('songs.searchLabel')}
            filterCount={activeFilters.length}
            onFilter={() => setIsFilterOpen(true)}
          />
          <FilterChips filters={activeFilters} />
          <GroupTitle
            title={isFiltered ? t('songs.results') : t('songs.library')}
            count={visible.length}
            hint={isWide ? t('songs.previewHint') : t(`songs.sortHint.${sort}`)}
            first
          />
          {isWide ? (
            <SongsTable
              songs={visible}
              selectedId={selectedSong?._id}
              sort={sort}
              dir={dir}
              onSort={(next) =>
                changeFilters({ sort: next, dir: next === sort && dir === 'asc' ? 'desc' : 'asc' })
              }
              onSelect={setSelectedId}
              onClearSearch={clearSearch}
              onClearFilters={clearFilters}
            />
          ) : (
            <SongRows
              songs={visible}
              sort={sort}
              grouped={text.trim() === ''}
              nextSetSongIds={nextSetSongIds(setlists, now)}
              onClearSearch={clearSearch}
              onClearFilters={clearFilters}
            />
          )}
        </div>
        {selectedSong ? (
          <SongPreview
            key={selectedSong._id}
            song={selectedSong}
            session={session}
            canEdit={false}
            slideOver={slideOver}
          />
        ) : null}
      </div>
      <SongFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        tempo={tempo}
        themes={themes}
        keys={keys}
        web={false}
        sort={sort}
        availableKeys={new Set(songs.flatMap((song) => tonicOf(song.originalKey) ?? []))}
        themeOptions={[...new Set(songs.flatMap((song) => song.themes))]}
        matchCount={visible.length}
        canSearchWeb={false}
        onChange={changeFilters}
      />
    </AppShell>
  );
}

function SongScreen({ song, withNotation }: { song: Song; withNotation: boolean }) {
  const { t } = useTranslation();
  const [mode] = useReaderMode();
  const [notation, setNotation] = useChordNotation();
  const originalKey = parseKey(song.originalKey);
  const [playKey, setPlayKey] = useState<MusicKey | null>(originalKey);
  const [capo, setCapo] = useSongCapo(song._id, song.capo);
  const auto = useAutoScroll(song._id);
  useKeyShortcuts(mode === 'chords' ? originalKey : null, playKey, setPlayKey);

  return (
    <ReaderLayout
      back={<ReaderBack to="/songs" label={t('songs.title')} />}
      modes={
        <>
          <ReaderModes />
          {withNotation && mode === 'chords' ? (
            <ChordNotationToggle notation={notation} onChange={setNotation} />
          ) : null}
        </>
      }
      auto={<AutoScrollButton auto={auto} placement="top" className="wide:inline-flex hidden" />}
      compactTitle={song.title}
      actions={
        <>
          <WideReadingControls auto={auto} />
          <ReadingSettings
            chordChart
            present={{
              songs: [toPresentSong(song, playKey, originalKey, capo)],
              startIndex: 0,
              onStart: () => (auto.running ? auto.toggle() : undefined),
              onExit: () => undefined,
            }}
          />
        </>
      }
      dock={
        <>
          <ReadingPanel
            auto={auto}
            trigger={
              <Button
                variant="glass"
                size="dock"
                className="text-[0.9375rem]"
                aria-label={t('reader.reading')}
              >
                Aa
              </Button>
            }
          />
          <AutoScrollButton auto={auto} placement="dock" />
          <span className="flex-1" />
          {mode === 'chords' && originalKey && playKey ? (
            <KeyPicker
              placement="dock"
              originalKey={originalKey}
              playKey={playKey}
              onChange={setPlayKey}
              capo={capo}
              onCapoChange={setCapo}
            />
          ) : null}
        </>
      }
    >
      <SongReader
        song={song}
        playKey={playKey}
        onPlayKeyChange={setPlayKey}
        capo={capo}
        onCapoChange={setCapo}
        chordChart
      />
    </ReaderLayout>
  );
}

function SetlistsScreen({ now }: { now: number }) {
  const { t, i18n: language } = useTranslation();
  const isWide = useIsWide();
  const session = demoSession(t);
  const names = useSetlistNames(session);
  const setlists = demoSetlists(t, now).map(toSetlistSummary);
  const [q, setQ] = useState('');
  const [show, setShow] = useState<SetlistOwnership>('all');
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [day, setDay] = useState<string | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPlayedOpen, setIsPlayedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [litDay, setLitDay] = useState<string | null>(null);

  const visible = filterSetlists(setlists, {
    search: q,
    ownership: show,
    userId: session.id,
    folderIds,
    day,
  });
  const isFiltering = q.trim() !== '' || show !== 'all' || folderIds.length > 0 || !!day;
  const groups = groupSetlists(visible, new Date(now), { leadWithNext: !isWide && !isFiltering });
  const sections = [
    {
      key: 'upcoming',
      title: groups.next ? t('setlists.upcoming') : t('setlists.comingUp'),
      items: groups.upcoming,
    },
    { key: 'undated', title: t('setlists.undated'), items: groups.undated },
    { key: 'past', title: t('setlists.played'), items: groups.past },
  ].filter(({ items }) => items.length > 0);
  const showPlayed = isPlayedOpen || isFiltering;
  const nextId = nextSetlistId(setlists, now);
  const selected = isWide ? setlists.find((setlist) => setlist._id === selectedId) : undefined;
  const slideOver = useSlideOver(selected !== undefined, () => setSelectedId(undefined));
  const activeFilters: ActiveFilter[] = [
    ...(show === 'all'
      ? []
      : [
          {
            key: 'show',
            label: t(`setlists.filters.chip.${show}`),
            onRemove: () => setShow('all'),
          },
        ]),
    ...folderIds.flatMap((id) => {
      const name = names.folders.get(id);
      return name
        ? [
            {
              key: `folder-${id}`,
              label: name,
              onRemove: () => setFolderIds(folderIds.filter((item) => item !== id)),
            },
          ]
        : [];
    }),
    ...(day
      ? [
          {
            key: 'day',
            label: new Intl.DateTimeFormat(dateLocale(language.language), {
              day: 'numeric',
              month: 'short',
            }).format(new Date(`${day}T00:00:00`)),
            onRemove: () => setDay(undefined),
          },
        ]
      : []),
  ];

  return (
    <AppShell session={session}>
      <SetlistListContext
        value={{
          litDay,
          onLightDay: setLitDay,
          selectedId: selected?._id,
          onSelect: isWide ? setSelectedId : undefined,
        }}
      >
        <PageHeader title={t('setlists.title')} />
        <div className="roomy:grid-cols-[minmax(0,1fr)_400px] roomy:items-start grid gap-x-10 gap-y-2">
          <div className="min-w-0">
            <Finder
              value={q}
              onChange={setQ}
              placeholder={t('setlists.searchPlaceholder')}
              label={t('setlists.searchLabel')}
              filterCount={(show === 'all' ? 0 : 1) + folderIds.length}
              onFilter={() => setIsFilterOpen(true)}
            />
            <FilterChips filters={activeFilters} />
            {groups.next ? <NextSetCard session={session} setlist={groups.next} now={now} /> : null}
            {sections.map((section, index) => (
              <section key={section.key} aria-labelledby={`setlists-${section.key}`}>
                <GroupTitle
                  id={`setlists-${section.key}`}
                  title={section.title}
                  count={section.items.length}
                  first={index === 0 && !groups.next}
                  action={
                    section.key === 'past' && !isFiltering ? (
                      <Button
                        variant="link"
                        size="sm"
                        aria-expanded={showPlayed}
                        onClick={() => setIsPlayedOpen(!isPlayedOpen)}
                      >
                        {showPlayed ? t('setlists.hidePlayed') : t('setlists.showPlayed')}
                      </Button>
                    ) : null
                  }
                />
                {section.key === 'past' && !showPlayed ? null : (
                  <ul className={section.key === 'past' ? LIST_COMPACT_CLASSES : LIST_CLASSES}>
                    {section.items.map((setlist) => (
                      <ManagedSetlistRow
                        key={setlist._id}
                        session={session}
                        setlist={setlist}
                        names={names}
                        status={setStatus(setlist, nextId, now)}
                        compact={section.key === 'past'}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
          <div className="border-hairline roomy:grid roomy:sticky roomy:top-3.5 roomy:border-l roomy:pl-8 compact:contents hidden gap-6">
            {selected ? (
              <SetlistPreview
                key={selected._id}
                session={session}
                setlist={selected}
                names={names}
                nextId={nextId}
                now={now}
                slideOver={slideOver}
              />
            ) : null}
            <div className="compact:hidden">
              <SetlistCalendar setlists={setlists} now={now} day={day} onDayChange={setDay} />
            </div>
          </div>
        </div>
        <SetlistFilterSheet
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          ownership={show}
          folderIds={folderIds}
          folders={[...names.folders].map(([id, name]) => ({
            id,
            name,
            count: setlists.filter((setlist) => setlist.groupIds.includes(id)).length,
          }))}
          matchCount={visible.length}
          onChange={(next) => {
            if (next.show) setShow(next.show);
            if (next.folders) setFolderIds(next.folders);
          }}
        />
      </SetlistListContext>
    </AppShell>
  );
}

function SetReaderScreen({ now, isPublic }: { now: number; isPublic: boolean }) {
  const { t } = useTranslation();
  const [songNumber, setSongNumber] = useState(1);
  const setlist = demoSetlists(t, now).find(({ urlKey }) => urlKey === DEMO_SETLIST_KEY);
  if (!setlist) return null;
  return (
    <MusicianView
      setlist={setlist}
      songNumber={songNumber}
      onSongChange={setSongNumber}
      isPublic={isPublic}
      actions={
        isPublic ? (
          <Button asChild variant="glass" size="icon-lg" className="wide:w-auto wide:px-4 text-sm">
            <Link
              to="/about/preview/$screen"
              params={{ screen: 'sharing' }}
              aria-label={t('about.preview.teamView')}
            >
              <Users className="wide:hidden" />
              <span className="wide:inline hidden">{t('about.preview.teamView')}</span>
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}

function SharingScreen({ now }: { now: number }) {
  const { t } = useTranslation();
  const session = demoSession(t);
  return (
    <AppShell session={session}>
      <div className="mb-5 flex justify-end">
        <Button asChild variant="secondary">
          <Link to="/about/preview/$screen" params={{ screen: 'public' }}>
            <ExternalLink />
            {t('about.preview.openPublicLink')}
          </Link>
        </Button>
      </div>
      <FolderDetail urlKey={DEMO_FOLDER_KEY} session={session} now={now} />
    </AppShell>
  );
}

function BilingualColumn({ now }: { now: number }) {
  const { t } = useTranslation();
  const session = demoSession(t);
  const setlists = demoSetlists(t, now);
  const folder = demoFolder(t, setlists);
  const names = {
    folders: new Map([[folder._id, folder.groupName]]),
    people: new Map(demoPeople(t).map((person) => [person.userId, person.fullName])),
  };
  const summaries = setlists.map(toSetlistSummary);
  const groups = groupSetlists(summaries, new Date(now), { leadWithNext: true });
  const nextId = nextSetlistId(summaries, now);
  return (
    <div className="min-w-0">
      <PageHeader title={t('setlists.title')} />
      <Finder
        sticky={false}
        value=""
        onChange={() => undefined}
        placeholder={t('setlists.searchPlaceholder')}
        label={t('setlists.searchLabel')}
      />
      {groups.next ? <NextSetCard session={session} setlist={groups.next} now={now} /> : null}
      <GroupTitle title={t('setlists.upcoming')} count={groups.upcoming.length} />
      <ul className={LIST_CLASSES}>
        {groups.upcoming.map((setlist) => (
          <li key={setlist._id}>
            <SetlistRow
              session={session}
              setlist={setlist}
              names={names}
              status={setStatus(setlist, nextId, now)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BilingualScreen({ now }: { now: number }) {
  const [columns] = useState(() =>
    LANGUAGES.map(({ code, label }) => ({
      code,
      label,
      i18n: i18n.cloneInstance({ lng: code }),
    }))
  );
  return (
    <div className="bg-ground wide:p-10 roomy:grid-cols-2 grid min-h-svh gap-10 p-5">
      {columns.map((column) => (
        <section key={column.code} lang={column.code} aria-label={column.label}>
          <p className="text-ink-3 mb-3 font-mono text-xs font-semibold tracking-[0.12em] uppercase">
            {column.label}
          </p>
          <I18nextProvider i18n={column.i18n}>
            <BilingualColumn now={now} />
          </I18nextProvider>
        </section>
      ))}
    </div>
  );
}

export function PreviewScreenView({ screen, now }: { screen: PreviewScreen; now: number }) {
  const { t } = useTranslation();
  const songs = demoSongs(t);
  const songByKey = (urlKey: string) => songs.find((song) => song.urlKey === urlKey);
  switch (screen) {
    case 'library':
      return <LibraryScreen now={now} />;
    case 'chart': {
      const song = songByKey('dmag01');
      return song ? <SongScreen key={song._id} song={song} withNotation /> : null;
    }
    case 'transpose': {
      const song = songByKey('dmbv04');
      return song ? <SongScreen key={song._id} song={song} withNotation={false} /> : null;
    }
    case 'setlists':
      return <SetlistsScreen now={now} />;
    case 'musician':
    case 'demo':
      return <SetReaderScreen key={screen} now={now} isPublic={false} />;
    case 'public':
      return <SetReaderScreen key={screen} now={now} isPublic />;
    case 'sharing':
      return <SharingScreen now={now} />;
  }
  return <BilingualScreen now={now} />;
}
