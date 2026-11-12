import type { TFunction } from 'i18next';

import type { Session } from '@/features/auth/session';
import type { Person } from '@/features/folders/api';
import type { Folder, Setlist, SetlistSummary } from '@/features/setlists/api';
import type { Song, SongSummary } from '@/features/songs/api';

type Hymn = {
  _id: string;
  urlKey: string;
  title: string;
  otherTitle: string;
  artist: string | { key: 'about.demoData.irishTraditional' };
  originalKey: string;
  tempo: string;
  timeSignature: string;
  themes: string[];
  chordLyrics: string;
};

const AMAZING_GRACE = `{Verse 1}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see

{Verse 2}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved`;

const HOLY_HOLY_HOLY = `{Verse 1}
[D]Holy, holy, [Bm]holy! [G]Lord God Al[D]mighty!
[D]Early in the [A]morning our [D]song shall [G]rise to [A]thee
[D]Holy, holy, [Bm]holy! [G]Merciful and [D]mighty!
[G]God in three [D]Persons, [Bm]bless[Em]ed [A]Trini[D]ty!

{Verse 2}
[D]Holy, holy, [Bm]holy! [G]All the saints a[D]dore thee,
[D]Casting down their [A]golden crowns a[D]round the [G]glassy [A]sea;
[D]Cherubim and [Bm]seraphim [G]falling down be[D]fore thee,
[G]Which wert, and [D]art, and [Bm]ever[Em]more [A]shalt [D]be.`;

const IT_IS_WELL = `{Verse 1}
When [C]peace like a [F]river at[C]tendeth my way,
When [Am]sorrows like [D7]sea billows [G]roll;
What[C]ever my [F]lot, thou hast [C]taught me to [Am]say,
It is [C]well, it is [G7]well with my [C]soul.

{Chorus}
It is [G]well (it is well) with my [C]soul (with my soul),
It is [F]well, it is [G7]well with my [C]soul.`;

const BE_THOU_MY_VISION = `{Verse 1}
[Eb]Be thou my [Ab]vi[Eb]sion, O [Bb]Lord of my [Cm]heart;
[Ab]Naught be all [Eb]else to me, [Ab]save that thou [Bb]art.
[Cm]Thou my best [Bb]thought, by [Eb]day or by [Ab]night,
[Eb]Waking or [Ab]sleep[Eb]ing, thy [Bb]presence my [Eb]light.`;

const SET_HYMNS: readonly Hymn[] = [
  {
    _id: 'd0000000000000000000a001',
    urlKey: 'dmag01',
    title: 'Amazing Grace',
    otherTitle: '奇異恩典',
    artist: 'John Newton',
    originalKey: 'G',
    tempo: 'Slow',
    timeSignature: '3/4',
    themes: ['Grace'],
    chordLyrics: AMAZING_GRACE,
  },
  {
    _id: 'd0000000000000000000a002',
    urlKey: 'dmhh02',
    title: 'Holy, Holy, Holy',
    otherTitle: '聖哉聖哉聖哉',
    artist: 'Reginald Heber',
    originalKey: 'D',
    tempo: 'Medium',
    timeSignature: '4/4',
    themes: ['Praise'],
    chordLyrics: HOLY_HOLY_HOLY,
  },
  {
    _id: 'd0000000000000000000a003',
    urlKey: 'dmiw03',
    title: 'It Is Well',
    otherTitle: '我心靈得安寧',
    artist: 'Horatio Spafford',
    originalKey: 'C',
    tempo: 'Slow',
    timeSignature: '4/4',
    themes: ['Trust'],
    chordLyrics: IT_IS_WELL,
  },
  {
    _id: 'd0000000000000000000a004',
    urlKey: 'dmbv04',
    title: 'Be Thou My Vision',
    otherTitle: '成為我異象',
    artist: { key: 'about.demoData.irishTraditional' },
    originalKey: 'Eb',
    tempo: 'Medium Slow',
    timeSignature: '3/4',
    themes: ['Trust'],
    chordLyrics: BE_THOU_MY_VISION,
  },
];

const extra = (
  id: string,
  urlKey: string,
  title: string,
  otherTitle: string,
  artist: string,
  originalKey: string,
  tempo: string,
  timeSignature: string,
  theme: string
): Hymn => ({
  _id: `d0000000000000000000${id}`,
  urlKey,
  title,
  otherTitle,
  artist,
  originalKey,
  tempo,
  timeSignature,
  themes: [theme],
  chordLyrics: '',
});

const LIBRARY_EXTRAS: readonly Hymn[] = [
  extra(
    'a005',
    'dmct05',
    'Come Thou Fount',
    '萬福泉源',
    'Robert Robinson',
    'D',
    'Medium',
    '3/4',
    'Grace'
  ),
  extra(
    'a006',
    'dmcr06',
    'Crown Him with Many Crowns',
    '以諸般冠冕',
    'Matthew Bridges',
    'D',
    'Medium',
    '4/4',
    'Praise'
  ),
  extra(
    'a007',
    'dmba07',
    'Blessed Assurance',
    '有福的確據',
    'Fanny Crosby',
    'D',
    'Medium',
    '9/8',
    'Trust'
  ),
  extra(
    'a008',
    'dmws08',
    'When I Survey the Wondrous Cross',
    '當我注目看奇妙十架',
    'Isaac Watts',
    'F',
    'Slow',
    '4/4',
    'Cross'
  ),
  extra(
    'a009',
    'dmac09',
    'All Creatures of Our God and King',
    '萬物頌',
    'William Draper',
    'Eb',
    'Fast',
    '3/4',
    'Praise'
  ),
  extra(
    'a010',
    'dmor10',
    'The Old Rugged Cross',
    '古舊十架',
    'George Bennard',
    'Bb',
    'Slow',
    '6/8',
    'Cross'
  ),
];

const HYMNS = [...SET_HYMNS, ...LIBRARY_EXTRAS];

const toSong = (hymn: Hymn, t: TFunction): Song => ({
  _id: hymn._id,
  urlKey: hymn.urlKey,
  title: hymn.title,
  artist: typeof hymn.artist === 'string' ? hymn.artist : t(hymn.artist.key),
  originalKey: hymn.originalKey,
  recommendedKeys: [],
  chordLyrics: hymn.chordLyrics,
  tempo: [hymn.tempo],
  timeSignature: [hymn.timeSignature],
  themes: hymn.themes,
});

export const demoSongs = (t: TFunction): Song[] => HYMNS.map((hymn) => toSong(hymn, t));

export const demoSetSongs = (t: TFunction): Song[] => SET_HYMNS.map((hymn) => toSong(hymn, t));

export const toSongSummary = (song: Song): SongSummary => ({
  _id: song._id,
  urlKey: song.urlKey,
  title: song.title,
  artist: song.artist,
  originalKey: song.originalKey,
  tempo: song.tempo,
  timeSignature: song.timeSignature,
  themes: song.themes,
});

const searchText = new Map(
  HYMNS.map((hymn) => [
    hymn._id,
    [hymn.title, hymn.otherTitle, hymn.chordLyrics.replace(/\[[^\]]*\]/g, '')]
      .join('\n')
      .toLocaleLowerCase(),
  ])
);

export const matchesDemoSearch = (song: SongSummary, keyword: string): boolean => {
  const query = keyword.trim().toLocaleLowerCase();
  if (query === '') return true;
  return (
    song.artist.toLocaleLowerCase().includes(query) ||
    (searchText.get(song._id)?.includes(query) ?? false)
  );
};

export const DEMO_FOLDER_ID = 'd0000000000000000000f001';
export const DEMO_FOLDER_KEY = 'dmfold';
export const DEMO_SETLIST_KEY = 'dmsun1';

const DEMO_USER = 'demo-musician';
const DEMO_LEADER = 'demo-leader';

const sundayOnOrAfter = (now: number): Date => {
  const today = new Date(now);
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + ((7 - today.getDay()) % 7)
  );
};

const dayFrom = (day: Date, offset: number): string =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset).toISOString();

const keysOf = (songs: readonly Song[]) =>
  songs.map((song) => ({ songId: song._id, key: song.originalKey }));

const toSetlist = (
  id: string,
  urlKey: string,
  name: string,
  date: string | null,
  createdBy: string,
  groupIds: string[],
  entries: Song[]
): Setlist => ({
  _id: `d0000000000000000000${id}`,
  urlKey,
  name,
  date,
  publicLink: urlKey,
  createdBy,
  groupIds,
  songs: entries,
  songKeys: keysOf(entries),
  songNotes: [],
});

export const demoSetlists = (t: TFunction, now: number): Setlist[] => {
  const sunday = sundayOnOrAfter(now);
  const songs = demoSetSongs(t);
  const library = demoSongs(t);
  const pick = (...ids: string[]) =>
    ids.flatMap((id) => library.filter((song) => song._id === `d0000000000000000000${id}`));
  return [
    toSetlist(
      'b001',
      DEMO_SETLIST_KEY,
      t('about.demoData.sundayService'),
      dayFrom(sunday, 0),
      DEMO_USER,
      [DEMO_FOLDER_ID],
      songs
    ),
    toSetlist(
      'b002',
      'dmyth2',
      t('about.demoData.youthNight'),
      dayFrom(sunday, 5),
      DEMO_LEADER,
      [DEMO_FOLDER_ID],
      pick('a009', 'a007', 'a003')
    ),
    toSetlist(
      'b003',
      'dmsun3',
      t('about.demoData.sundayService'),
      dayFrom(sunday, 7),
      DEMO_USER,
      [],
      pick('a006', 'a005', 'a001')
    ),
    toSetlist(
      'b004',
      'dmxmas',
      t('about.demoData.christmasIdeas'),
      null,
      DEMO_USER,
      [],
      pick('a002', 'a008')
    ),
    toSetlist(
      'b005',
      'dmsun0',
      t('about.demoData.sundayService'),
      dayFrom(sunday, -7),
      DEMO_USER,
      [],
      pick('a004', 'a002', 'a010')
    ),
    toSetlist(
      'b006',
      'dmpray',
      t('about.demoData.prayerMeeting'),
      dayFrom(sunday, -9),
      DEMO_LEADER,
      [DEMO_FOLDER_ID],
      pick('a003', 'a008')
    ),
  ];
};

export const toSetlistSummary = (setlist: Setlist): SetlistSummary => ({
  _id: setlist._id,
  urlKey: setlist.urlKey,
  name: setlist.name,
  date: setlist.date,
  publicLink: setlist.publicLink,
  createdBy: setlist.createdBy,
  groupIds: setlist.groupIds,
  songs: setlist.songs.map(({ _id, title }) => ({ _id, title })),
});

export const demoFolder = (t: TFunction, setlists: readonly Setlist[]): Folder => ({
  _id: DEMO_FOLDER_ID,
  urlKey: DEMO_FOLDER_KEY,
  groupName: t('about.demoData.folder'),
  setlistIds: setlists
    .filter((setlist) => setlist.groupIds.includes(DEMO_FOLDER_ID))
    .map((setlist) => setlist._id),
  createdBy: DEMO_LEADER,
  createdAt: null,
});

export const demoPeople = (t: TFunction): Person[] =>
  (
    [
      [DEMO_USER, 'about.demoData.people.you'],
      [DEMO_LEADER, 'about.demoData.people.leader'],
      ['demo-keys', 'about.demoData.people.keys'],
      ['demo-bass', 'about.demoData.people.bass'],
    ] as const
  ).map(([userId, nameKey], index) => ({
    _id: `d0000000000000000000c00${index + 1}`,
    userId,
    fullName: t(nameKey),
    groupIds: [{ id: DEMO_FOLDER_ID }],
  }));

export const demoSession = (t: TFunction): Session => {
  const fullName = t('about.demoData.people.you');
  return {
    id: DEMO_USER,
    email: 'musician@example.com',
    fullName,
    accessType: 'member',
    ownership: {
      _id: 'd0000000000000000000c001',
      userId: DEMO_USER,
      fullName,
      accessType: 'member',
      groupIds: [{ id: DEMO_FOLDER_ID }],
      setlistIds: [],
    },
  };
};
