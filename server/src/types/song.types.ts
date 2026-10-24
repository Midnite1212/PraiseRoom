import { RecordFields } from './record.types';

type SongRecord = RecordFields & {
  urlKey: string;
  title: string;
  tempo: string[];
  originalKey: string;
  recommendedKeys: string[];
  themes: string[];
  artist: string;
  year?: string;
  capo?: number;
  credits?: string;
  code?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  timeSignature: string[];
  isVerified: boolean;
  chordLyrics: string;
  simplifiedChordLyrics?: string;
  isDeleted: boolean;
};

type PublicSongRecord = Omit<SongRecord, 'createdBy' | 'lastUpdatedBy'>;

type SongViewRecord = Omit<PublicSongRecord, 'recommendedKeys' | 'chordLyrics'>;

export { PublicSongRecord, SongRecord, SongViewRecord };
