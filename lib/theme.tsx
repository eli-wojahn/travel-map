'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY } from '@/lib/theme-constants';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isReady: boolean;
  setTheme: (nextTheme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : 'light';
  } catch {
    return 'light';
  }
}

function applyThemeClass(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const htmlElement = document.documentElement;
  htmlElement.classList.toggle('dark', resolvedTheme === 'dark');
  htmlElement.style.colorScheme = resolvedTheme;
}

function resolveTheme(themePreference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
  if (themePreference === 'system') {
    return systemTheme;
  }

  return themePreference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('light');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setThemeState(getStoredThemePreference());
    setSystemTheme(getSystemTheme());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleMediaChange);
      return () => mediaQueryList.removeEventListener('change', handleMediaChange);
    }

    mediaQueryList.addListener(handleMediaChange);
    return () => mediaQueryList.removeListener(handleMediaChange);
  }, []);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    applyThemeClass(resolvedTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // no-op: localStorage pode estar indisponível em modo privado/restrito.
    }
  }, [theme, resolvedTheme, isReady]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isReady,
      setTheme,
    }),
    [theme, resolvedTheme, isReady, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
