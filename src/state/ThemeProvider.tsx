import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { PALETTES, applyTheme } from '../lib/color';
import { THEME_STORAGE_KEY } from '../lib/storage';
import type { ThemeSettings } from '../types';

interface ThemeContextValue {
  theme: ThemeSettings;
  accent: string;
  dark: boolean;
  setMode: (mode: ThemeSettings['mode']) => void;
  setPalette: (palette: string) => void;
  setCustomColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaults: ThemeSettings = {
  mode: 'light',
  palette: 'terracotta',
  customColor: '#a33900',
};

const readTheme = (): ThemeSettings => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<ThemeSettings>) };
  } catch {
    return defaults;
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(readTheme);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, []);

  const paletteColor = PALETTES.find((palette) => palette.id === theme.palette)?.color;
  const accent = paletteColor ?? theme.customColor;
  const dark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);

  useEffect(() => {
    applyTheme(accent, dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // The theme still applies for this session.
    }
  }, [accent, dark, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      accent,
      dark,
      setMode: (mode) => setTheme((current) => ({ ...current, mode })),
      setPalette: (palette) => setTheme((current) => ({ ...current, palette })),
      setCustomColor: (customColor) => setTheme((current) => ({ ...current, palette: 'custom', customColor })),
    }),
    [theme, accent, dark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
