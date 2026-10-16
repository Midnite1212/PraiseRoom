import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { customAxios as axios } from '../components/custom/customAxios';
import { SessionContext } from '../components/custom/SessionProvider';
import { fetchSongs } from '../reducers';
import { useAppSelector } from '../store';
import { Setlist } from '../types/setlist.types';
import { SongSchema } from '../types/song.types';
import { User, toUserAccessType } from '../types/user.types';
import { logRequestError } from './global';

export const useUser = (): {
  user?: User;
  loading: boolean;
  refreshSession: () => Promise<boolean>;
} => {
  const { identity, loading, refreshSession } = useContext(SessionContext);
  const ownership = useAppSelector((state) => state.ownership);

  const user: User | undefined = identity
    ? { ...identity, accessType: toUserAccessType(ownership?.accessType) }
    : undefined;

  return { user, loading, refreshSession };
};

export const useSongs = (id?: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchAllSongs = async () => {
      try {
        const { data, status } = await axios.get<SongSchema[]>('/api/songs/get');
        if (status === 200) {
          dispatch(fetchSongs(data));
        }
      } catch (e) {
        logRequestError('Error fetching songs:', e);
      }
    };
    fetchAllSongs();
  }, [dispatch]);

  const allSongs = useAppSelector((state) => state.songs);
  if (id) {
    const song = allSongs.find((song) => song._id === id);
    return song;
  }
  return allSongs;
};

export const useOwnership = () => {
  const ownership = useAppSelector((state) => state.ownership);
  return ownership;
};

export const useOwnedSetlists = () => {
  const ownership = useOwnership();
  const [setlists, setSetlists] = useState<Setlist[]>([]);

  useEffect(() => {
    const fetchSetlists = async () => {
      const setlistIds = ownership?.setlistIds ?? [];
      if (setlistIds.length > 0) {
        try {
          const setlistRes = await axios.get<Setlist[]>('/api/setlists/get');
          if (setlistRes.status === 200) {
            const filteredSetlists = setlistRes.data.filter((setlist) =>
              setlistIds.some((setlistOwnership) => setlistOwnership.id === setlist._id)
            );
            setSetlists(filteredSetlists);
          }
        } catch (error) {
          logRequestError('Error fetching setlists:', error);
        }
      }
    };

    fetchSetlists();
  }, [ownership]);

  return setlists;
};
