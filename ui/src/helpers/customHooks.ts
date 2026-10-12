import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { authClient } from '../components/custom/authClient';
import { customAxios as axios } from '../components/custom/customAxios';
import { fetchOwnership, fetchSongs } from '../reducers';
import { useAppSelector } from '../store';
import { Ownership } from '../types/ownership.types';
import { Setlist } from '../types/setlist.types';
import { SongSchema } from '../types/song.types';
import { User, toUserAccessType } from '../types/user.types';
import { logRequestError } from './global';

type Identity = {
  id: string;
  email: string;
  fullName: string;
};

export const useUser = (): { user?: User; loading: boolean } => {
  const dispatch = useDispatch();
  const ownership = useAppSelector((state) => state.ownership);
  const [identity, setIdentity] = useState<Identity>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await authClient.getSession();
        if (ignore) {
          return;
        }
        if (error || !data) {
          setIdentity(undefined);
          return;
        }

        const { id, email, name } = data.user;
        setIdentity({ id, email, fullName: name });

        const { data: ownershipData, status } = await axios.get<Ownership>('/api/ownerships/get', {
          params: { userId: id },
          validateStatus: (responseStatus) => responseStatus === 200 || responseStatus === 404,
        });
        if (ignore) {
          return;
        }
        if (status === 404) {
          const { data: createdOwnership } = await axios.post<Ownership>('/api/ownerships/create', {
            fullName: name,
          });
          if (!ignore) {
            dispatch(fetchOwnership(createdOwnership));
          }
        } else {
          dispatch(fetchOwnership(ownershipData));
        }
      } catch (err: unknown) {
        if (!ignore) {
          logRequestError('Session verification failed', err);
          setIdentity(undefined);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    loadSession();
    return () => {
      ignore = true;
    };
  }, [dispatch]);

  const user: User | undefined = identity
    ? { ...identity, accessType: toUserAccessType(ownership?.accessType) }
    : undefined;

  return { user, loading };
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
