import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { emptyState, State } from './types';

const KEY = 'profitsh:v1';

type Ctx = { state: State; update: (fn: (s: State) => State) => void; loaded: boolean };
const StoreCtx = createContext<Ctx>({ state: emptyState(), update: () => {}, loaded: false });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(emptyState());
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(state);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          const next = { ...emptyState(), ...parsed, settings: { ...emptyState().settings, ...parsed.settings } };
          ref.current = next;
          setState(next);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    const next = fn(ref.current);
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return <StoreCtx.Provider value={{ state, update, loaded }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
