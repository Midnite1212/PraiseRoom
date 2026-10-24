import { RecordFields } from './record.types';
import { PublicSongRecord, SongRecord } from './song.types';

type SetlistSongKey = {
  songId: string;
  key: string;
};

type SetlistSongNote = {
  songId: string;
  note: string;
};

type SetlistRecord = RecordFields & {
  urlKey: string;
  name: string;
  date: Date | null;
  createdBy?: string;
  songs: string[];
  songKeys: SetlistSongKey[];
  songNotes: SetlistSongNote[];
  lastUpdatedBy?: string;
  publicLink: string | null;
  groupIds: string[];
  isDeleted: boolean;
};

type PopulatedSetlistRecord = Omit<SetlistRecord, 'songs'> & { songs: SongRecord[] };

type PublicSetlistRecord = Omit<
  SetlistRecord,
  'createdBy' | 'lastUpdatedBy' | 'groupIds' | 'songs'
> & { songs: PublicSongRecord[] };

type SetlistAccess = {
  _id: string;
  createdBy?: string;
  groupIds: string[];
  songs: string[];
};

export {
  PopulatedSetlistRecord,
  PublicSetlistRecord,
  SetlistAccess,
  SetlistRecord,
  SetlistSongKey,
  SetlistSongNote,
};
