import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/es/storage';
import { ownershipSlice, songSlice } from './reducers';
import { signout } from './reducers/sessionSlice';

// The pre-Neon key held the main-site JWT; it must not linger in localStorage.
export const LEGACY_PERSIST_KEY = 'persist:root';

try {
  window.localStorage.removeItem(LEGACY_PERSIST_KEY);
} catch {
  // Storage can be unavailable (private mode); nothing to clean up then.
}

const persistConfig = {
  key: 'root-v2',
  storage,
  whitelist: [],
};

const appReducer = combineReducers({
  songs: songSlice,
  ownership: ownershipSlice,
});

const rootReducer: typeof appReducer = (state, action) =>
  appReducer(signout.match(action) ? undefined : state, action);

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
