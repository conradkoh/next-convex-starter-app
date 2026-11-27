'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  applyUiScale,
  normalizeUiScale,
  readStoredUiScale,
  UI_SCALE_STORAGE_KEY,
  type UiScale,
} from './ui-scale-utils';

type UiScaleProviderProps = {
  children: React.ReactNode;
};

type UiScaleContextData = {
  isUiScaleReady: boolean;
  setUiScale: (next: UiScale) => void;
  uiScale: UiScale | null;
};

const UiScaleContext = createContext<UiScaleContextData | null>(null);

export function useUiScale() {
  const context = useContext(UiScaleContext);
  if (!context) {
    throw new Error('useUiScale must be used within a UiScaleProvider');
  }
  return context;
}

/**
 * Applies the per-device Display Size preference to the document root and
 * exposes it to the settings control. Mirrors ThemeProvider's hydration-safe
 * shape: the stored value is read after mount so server and client render the
 * same output.
 */
export function UiScaleProvider({ children }: UiScaleProviderProps) {
  const [uiScale, _setUiScale] = useState<UiScale | null>(null);
  const [isUiScaleReady, setIsUiScaleReady] = useState(false);

  const setUiScale = useCallback((next: UiScale) => {
    const normalized = normalizeUiScale(next);
    _setUiScale(normalized);
    applyUiScale(normalized);
    try {
      window.localStorage.setItem(UI_SCALE_STORAGE_KEY, String(normalized));
    } catch {
      // Storage unavailable: the choice still applies for this session.
    }
  }, []);

  useEffect(() => {
    const stored = readStoredUiScale();
    applyUiScale(stored);
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state -- intentional: the stored scale is unavailable during SSR; read after mount to keep hydration output identical
    _setUiScale(stored);
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state -- intentional: the provider renders children immediately; only the Display Size control gates on isUiScaleReady
    setIsUiScaleReady(true);
  }, []);

  return (
    <UiScaleContext.Provider value={{ isUiScaleReady, setUiScale, uiScale }}>
      {children}
    </UiScaleContext.Provider>
  );
}
