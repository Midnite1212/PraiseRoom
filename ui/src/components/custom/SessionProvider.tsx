import { ReactNode, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { authClient } from './authClient';
import { customAxios as axios } from './customAxios';
import { logRequestError } from '../../helpers/global';
import { fetchOwnership } from '../../reducers';
import { Ownership } from '../../types/ownership.types';

export type SessionIdentity = {
  id: string;
  email: string;
  fullName: string;
};

type SessionContextValue = {
  identity?: SessionIdentity;
  loading: boolean;
  refreshSession: () => Promise<boolean>;
};

type SessionProviderProps = {
  children: ReactNode;
};

export const SessionContext = createContext<SessionContextValue>({
  loading: true,
  refreshSession: async () => false,
});

const SessionProvider = ({ children }: SessionProviderProps) => {
  const dispatch = useDispatch();
  const [identity, setIdentity] = useState<SessionIdentity>();
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef(0);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current;
    try {
      const { data, error } = await authClient.getSession();
      if (!isCurrent()) {
        return false;
      }
      if (error || !data) {
        setIdentity(undefined);
        return false;
      }

      const { id, email, name } = data.user;
      const { data: ownershipData, status } = await axios.get<Ownership>('/api/ownerships/get', {
        params: { userId: id },
        validateStatus: (responseStatus) => responseStatus === 200 || responseStatus === 404,
      });
      const ownership =
        status === 404
          ? (await axios.post<Ownership>('/api/ownerships/create', { fullName: name })).data
          : ownershipData;
      if (!isCurrent()) {
        return false;
      }
      dispatch(fetchOwnership(ownership));
      setIdentity({ id, email, fullName: name });
      return true;
    } catch (err: unknown) {
      if (isCurrent()) {
        logRequestError('Session verification failed', err);
        setIdentity(undefined);
      }
      return false;
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({ identity, loading, refreshSession }),
    [identity, loading, refreshSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
