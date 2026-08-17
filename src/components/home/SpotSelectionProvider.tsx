"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SpotSelectionValue = {
  selectedId: string | null;
  /** Bumped on every explicit pick so re-picking the same spot re-centers the map. */
  focusNonce: number;
  select: (id: string) => void;
  clear: () => void;
  /** Notifies on every pick, for UI that has to get out of the map's way. */
  subscribeToFocus: (listener: () => void) => () => void;
};

const SpotSelectionContext = createContext<SpotSelectionValue | null>(null);

/** Returns null outside a provider, letting components keep their standalone behaviour. */
export function useSpotSelection(): SpotSelectionValue | null {
  return useContext(SpotSelectionContext);
}

export function SpotSelectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ id: string | null; nonce: number }>({
    id: null,
    nonce: 0,
  });

  const listenersRef = useRef(new Set<() => void>());

  const select = useCallback((id: string) => {
    setState((prev) => ({ id, nonce: prev.nonce + 1 }));
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const clear = useCallback(() => {
    setState((prev) => (prev.id === null ? prev : { ...prev, id: null }));
  }, []);

  const subscribeToFocus = useCallback((listener: () => void) => {
    const listeners = listenersRef.current;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({
      selectedId: state.id,
      focusNonce: state.nonce,
      select,
      clear,
      subscribeToFocus,
    }),
    [state, select, clear, subscribeToFocus],
  );

  return (
    <SpotSelectionContext.Provider value={value}>
      {children}
    </SpotSelectionContext.Provider>
  );
}
