import { Bulletlist, ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/primitives/brand-mark';
import { Panel } from '@/components/primitives/panel';
import { Segmented } from '@/components/primitives/segmented';
import { Button } from '@/components/ui/button';
import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey, parseKey } from '@/features/chords/theory';
import { useAutoScroll } from '@/features/reader/auto-scroll';
import { AutoScrollButton } from '@/features/reader/auto-scroll-controls';
import { useReaderMode } from '@/features/reader/chord-display';
import { KeyPicker } from '@/features/reader/key-picker';
import { toPresentSong } from '@/features/reader/present-slides';
import { ReadingPanel, ShareButton, WideReadingControls } from '@/features/reader/reader-controls';
import { ReaderLayout } from '@/features/reader/reader-layout';
import { ReaderModes } from '@/features/reader/reader-modes';
import { ReadingSettings } from '@/features/reader/reading-settings';
import { readSongCapo, useSongCapo } from '@/features/reader/song-capo';
import { SongReader } from '@/features/reader/song-reader';
import { useKeyShortcuts } from '@/features/reader/use-key-shortcuts';
import { ViewOneIcon, ViewSplitIcon } from '@/features/reader/view-icons';
import { useIsRoomy, useIsWide } from '@/hooks/use-wide';
import { createStoredChoice } from '@/lib/stored-choice';

import { keyForSong, noteForSong, publicSetlistUrl, type Setlist } from '../api';
import { formatSetlistDate } from '../format-date';
import { useLocalOrder } from './local-order';
import {
  EditOrderButton,
  OrderFoot,
  SetlistProgress,
  type SetlistSongItem,
  SetlistSongbar,
  SetlistSongRows,
} from './setlist-songs';
import {
  pinAfterMove,
  pinAfterPick,
  READER_LAYOUTS,
  type ReaderLayoutChoice,
  rightPane,
  useReaderLayout,
} from './split-panes';
import { SplitView } from './split-view';
import { useSongSwipe } from './use-song-swipe';

const LAYOUT_ICONS = { one: ViewOneIcon, split: ViewSplitIcon } as const;

// Wide screens: One | Split, kept per device.
function LayoutToggle({
  layout,
  onChange,
}: {
  layout: ReaderLayoutChoice;
  onChange: (layout: ReaderLayoutChoice) => void;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      glass
      size="lg"
      value={layout}
      onChange={onChange}
      label={t('reader.layout')}
      optionClassName="min-w-11 px-2.5"
      options={READER_LAYOUTS.map((value) => {
        const Icon = LAYOUT_ICONS[value];
        return {
          value,
          label: <Icon />,
          ariaLabel: t(value === 'one' ? 'reader.oneSong' : 'reader.splitSongs'),
        };
      })}
    />
  );
}

// A hook-named alias, so the React Compiler calls it on every render instead of memoizing it.
const useSongListVisibility = createStoredChoice(
  'setlist-song-list',
  ['shown', 'hidden'],
  'shown'
).use;

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

type MusicianViewProps = {
  setlist: Setlist;
  songNumber: number;
  onSongChange: (songNumber: number) => void;
  // Start of the top row: "‹ Setlists" in the app; nothing on the public link.
  back?: ReactNode;
  // End of the top row, before Share: Edit in the app; Open in the app / Sign in on the public link.
  actions?: ReactNode;
  // The public link: Reading settings has no Settings page to link to.
  isPublic?: boolean;
};

// One setlist on screen: the current song in the reader, the set beside it (a glass sidebar or a row of
// songs on wide screens, progress pixels and an Up next dock on phones), and ← / → to change songs.
export function MusicianView({
  setlist,
  songNumber,
  onSongChange,
  back,
  actions,
  isPublic = false,
}: MusicianViewProps) {
  const { t, i18n } = useTranslation();
  const [mode] = useReaderMode();
  const [chosenKeys, setChosenKeys] = useState<Record<string, number>>({});
  const [isListOpen, setIsListOpen] = useState(false);
  const [songList, setSongList] = useSongListVisibility();
  const [isReordering, setIsReordering] = useState(false);
  const [isBarOrderOpen, setIsBarOrderOpen] = useState(false);
  const isWide = useIsWide();
  const isRoomy = useIsRoomy();
  const isSidebarShown = songList === 'shown' && isRoomy;
  const [layout, setLayout] = useReaderLayout();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [leftPane, setLeftPane] = useState<HTMLElement | null>(null);

  const { order, isCustom, setOrder, reset } = useLocalOrder(
    setlist._id,
    setlist.songs.map((entry) => entry._id)
  );
  const entriesById = new Map(setlist.songs.map((entry) => [entry._id, entry]));
  const entries = order.flatMap((id) => {
    const entry = entriesById.get(id);
    return entry ? [entry] : [];
  });

  const songCount = entries.length;
  const currentIndex = Math.min(Math.max(songNumber, 1), Math.max(songCount, 1)) - 1;
  const song = entries[currentIndex];
  const [capo, changeCapo] = useSongCapo(song?._id ?? '', song?.capo);
  const nextSong = entries[currentIndex + 1];
  const pillSong = nextSong ?? entries[currentIndex - 1];
  const canSplit = isWide && isRoomy && songCount > 1;
  const isSplit = canSplit && layout === 'split';
  const auto = useAutoScroll(song?._id ?? '', isSplit ? leftPane : null);
  const songIds = entries.map((entry) => entry._id);
  const right = isSplit ? rightPane(songIds, currentIndex, pinnedId) : null;

  const goToSong = (number: number) => {
    if (number < 1 || number > songCount) return;
    setPinnedId(pinAfterMove(songIds, pinnedId, number - 1));
    onSongChange(number);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight') goToSong(currentIndex + 2);
      if (event.key === 'ArrowLeft') goToSong(currentIndex);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const playKeyFor = (index: number): MusicKey | null => {
    const entry = entries[index];
    if (!entry) return null;
    const originalKey = parseKey(entry.originalKey);
    const chosenRoot = chosenKeys[entry._id];
    if (chosenRoot !== undefined && originalKey)
      return conventionalKey(chosenRoot, originalKey.isMinor);
    return parseKey(keyForSong(setlist, entry)) ?? originalKey;
  };
  useSongSwipe((direction) => goToSong(currentIndex + 1 + direction));
  useKeyShortcuts(
    mode === 'chords' && song ? parseKey(song.originalKey) : null,
    playKeyFor(currentIndex),
    (key) => {
      if (song) setChosenKeys((keys) => ({ ...keys, [song._id]: key.root }));
    }
  );
  const songs = entries.map((entry, index) => {
    const playKey = playKeyFor(index);
    const isShown = right !== null && right.index === index;
    return {
      id: entry._id,
      title: entry.title,
      keyLabel: playKey ? keyLabel(playKey) : entry.originalKey,
      isShown,
      tag: isShown && right.isPinned ? t('reader.pinned') : undefined,
    };
  });
  const select = (number: number) => {
    setIsListOpen(false);
    goToSong(number);
  };
  const followSong = (ids: readonly string[]) => {
    const position = song ? ids.indexOf(song._id) : -1;
    if (position >= 0) onSongChange(position + 1);
  };
  const reorder = (next: SetlistSongItem[]) => {
    const ids = next.map((item) => item.id);
    setOrder(ids);
    followSong(ids);
  };
  const resetOrder = () => {
    reset();
    followSong(setlist.songs.map((entry) => entry._id));
  };
  const changeListOpen = (open: boolean) => {
    setIsListOpen(open);
    if (!open) setIsReordering(false);
  };
  const changeBarOrderOpen = (open: boolean) => {
    setIsBarOrderOpen(open);
    setIsReordering(open);
  };

  const date = formatSetlistDate(setlist.date, i18n.language);
  const meta = [date ?? t('setlists.noDate'), t('reader.songCount', { count: songCount })].join(
    ' · '
  );
  const readingSettings = (
    <ReadingSettings
      showSettingsLink={!isPublic}
      present={{
        songs: entries.map((entry, index) =>
          toPresentSong(
            entry,
            playKeyFor(index),
            parseKey(entry.originalKey),
            index === currentIndex ? capo : (readSongCapo(entry._id) ?? entry.capo ?? 0)
          )
        ),
        startIndex: currentIndex,
        onStart: () => (auto.running ? auto.toggle() : undefined),
        onExit: (songIndex) => {
          if (songIndex !== currentIndex) goToSong(songIndex + 1);
        },
      }}
    />
  );
  const share = <ShareButton link={setlist.publicLink ? publicSetlistUrl(setlist) : null} />;

  if (!song) {
    return (
      <ReaderLayout
        back={back}
        modes={<ReaderModes />}
        actions={
          <>
            {readingSettings}
            {actions}
            {share}
          </>
        }
        dock={null}
      >
        <p className="text-ink-2 py-10 text-center">{t('reader.emptySetlist')}</p>
      </ReaderLayout>
    );
  }

  const originalKey = parseKey(song.originalKey);
  const playKey = playKeyFor(currentIndex);
  const changeKeyFor = (songId: string, key: MusicKey) =>
    setChosenKeys((keys) => ({ ...keys, [songId]: key.root }));
  const changeKey = (key: MusicKey) => changeKeyFor(song._id, key);
  const sidebarLabel = isSidebarShown ? t('reader.hideSongList') : t('reader.showSongList');
  const listProps = { songs, currentIndex, onSelect: select };
  const editableListProps = { ...listProps, isEditing: isReordering, onReorder: reorder };
  const orderFoot = <OrderFoot isEditing={isReordering} isCustom={isCustom} onReset={resetOrder} />;

  return (
    <ReaderLayout
      back={back}
      title={
        <>
          {isRoomy ? (
            <Button
              variant="glass"
              size="icon-lg"
              aria-pressed={isSidebarShown}
              aria-label={sidebarLabel}
              title={sidebarLabel}
              onClick={() => {
                setIsReordering(false);
                setSongList(isSidebarShown ? 'hidden' : 'shown');
              }}
            >
              <Bulletlist />
            </Button>
          ) : null}
          <BrandMark />
          <strong className="truncate text-[0.9375rem] font-semibold">{setlist.name}</strong>
          {date ? (
            <span className="text-ink-2 text-[0.8125rem] whitespace-nowrap">{date}</span>
          ) : null}
        </>
      }
      layout={canSplit ? <LayoutToggle layout={layout} onChange={setLayout} /> : null}
      modes={<ReaderModes />}
      isSplit={isSplit}
      auto={<AutoScrollButton auto={auto} placement="top" className="wide:inline-flex hidden" />}
      compactTitle={song.title}
      actions={
        <>
          <WideReadingControls auto={auto} />
          {readingSettings}
          {actions}
          {share}
        </>
      }
      sidebar={
        isSidebarShown ? (
          <>
            <div className="flex items-start justify-between gap-2 pr-1 pb-2.5 pl-2.5">
              <div>
                <h2 className="text-base font-semibold">{t('reader.setlist')}</h2>
                <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{meta}</p>
              </div>
              <EditOrderButton
                isEditing={isReordering}
                onClick={() => setIsReordering(!isReordering)}
              />
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              <SetlistSongRows {...editableListProps} />
            </div>
            {orderFoot}
            <div className="border-hairline mt-2 flex items-center justify-between gap-1.5 border-t pt-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('reader.previous')}
                disabled={currentIndex === 0}
                onClick={() => goToSong(currentIndex)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-ink-3 flex items-center gap-1.5 text-xs">
                <kbd className="bg-fill-hover text-ink-2 inline-grid h-5 min-w-5 place-items-center rounded-[5px] px-1 font-mono text-xs font-semibold">
                  ←
                </kbd>
                <kbd className="bg-fill-hover text-ink-2 inline-grid h-5 min-w-5 place-items-center rounded-[5px] px-1 font-mono text-xs font-semibold">
                  →
                </kbd>
                {t('reader.changeSongs')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('reader.next')}
                disabled={currentIndex >= songCount - 1}
                onClick={() => goToSong(currentIndex + 2)}
              >
                <ChevronRight />
              </Button>
            </div>
          </>
        ) : undefined
      }
      songbar={
        isSidebarShown ? undefined : (
          <>
            <SetlistSongbar {...listProps} />
            <Panel
              open={isBarOrderOpen}
              onOpenChange={changeBarOrderOpen}
              align="end"
              title={setlist.name}
              description={meta}
              headerAction={<EditOrderButton isEditing onClick={() => changeBarOrderOpen(false)} />}
              trigger={
                <EditOrderButton isEditing={false} className="h-10 flex-none rounded-full" />
              }
            >
              <SetlistSongRows {...editableListProps} />
              {orderFoot}
            </Panel>
          </>
        )
      }
      progress={<SetlistProgress {...listProps} />}
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
          <div className="glass glass-over flex h-14 min-w-0 flex-1 items-center px-1">
            <Button
              variant="ghost"
              size="dock-step"
              className="flex-none"
              aria-label={t('reader.previous')}
              disabled={currentIndex === 0}
              onClick={() => goToSong(currentIndex)}
            >
              <ChevronLeft />
            </Button>
            <Panel
              open={isListOpen}
              onOpenChange={changeListOpen}
              title={setlist.name}
              description={meta}
              headerAction={
                <EditOrderButton
                  isEditing={isReordering}
                  onClick={() => setIsReordering(!isReordering)}
                />
              }
              sheetClassName="bottom-[calc(var(--bottom)+var(--dock-h)+10px)]"
              trigger={
                <button
                  type="button"
                  aria-label={`${t('reader.setlist')}: ${currentIndex + 1}/${songCount}`}
                  className="hover:bg-fill-hover flex h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-full leading-tight"
                >
                  {pillSong ? (
                    <small className="text-ink-3 text-xs">
                      {nextSong ? t('reader.upNext') : t('reader.previous')}
                    </small>
                  ) : null}
                  <span className="max-w-full truncate px-1 text-sm font-semibold">
                    {pillSong ? pillSong.title : t('reader.endOfSet')}
                  </span>
                </button>
              }
            >
              <SetlistSongRows {...editableListProps} />
              {orderFoot}
            </Panel>
            <Button
              variant="ghost"
              size="dock-step"
              className="flex-none"
              aria-label={t('reader.next')}
              disabled={currentIndex >= songCount - 1}
              onClick={() => goToSong(currentIndex + 2)}
            >
              <ChevronRight />
            </Button>
          </div>
          {mode === 'chords' && originalKey && playKey ? (
            <KeyPicker
              placement="dock"
              originalKey={originalKey}
              playKey={playKey}
              onChange={changeKey}
              capo={capo}
              onCapoChange={changeCapo}
            />
          ) : null}
        </>
      }
    >
      {right ? (
        <SplitView
          entries={entries}
          songs={songs}
          currentIndex={currentIndex}
          rightIndex={right.index}
          isPinned={right.isPinned}
          playKeyFor={playKeyFor}
          onPlayKeyChange={changeKeyFor}
          noteFor={(songId) => noteForSong(setlist, songId)}
          onPlay={(index) => goToSong(index + 1)}
          onShowBeside={(songId) => setPinnedId(pinAfterPick(songIds, currentIndex, songId))}
          leftPaneRef={setLeftPane}
          repeats={isPublic ? 'all' : undefined}
        />
      ) : (
        <SongReader
          key={song._id}
          song={song}
          playKey={playKey}
          onPlayKeyChange={changeKey}
          capo={capo}
          onCapoChange={changeCapo}
          note={noteForSong(setlist, song._id)}
          repeats={isPublic ? 'all' : undefined}
        >
          {currentIndex === songCount - 1 ? (
            <div className="border-hairline text-ink-2 mt-10 flex items-center gap-3.5 border-t py-5">
              <span aria-hidden className="flex gap-1">
                {songs.map(({ id }) => (
                  <i key={id} className="bg-pixel-played size-2" />
                ))}
              </span>
              {t('reader.endOfSet')}
            </div>
          ) : null}
        </SongReader>
      )}
    </ReaderLayout>
  );
}
