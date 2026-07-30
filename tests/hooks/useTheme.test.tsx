import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { THEME_STORAGE_KEY } from '@/lib/theme-constants';

function createMatchMediaMock(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_event: string, callback: (event: MediaQueryListEvent) => void) => {
      listeners.add(callback);
    },
    removeEventListener: (_event: string, callback: (event: MediaQueryListEvent) => void) => {
      listeners.delete(callback);
    },
    addListener: (callback: (event: MediaQueryListEvent) => void) => {
      listeners.add(callback);
    },
    removeListener: (callback: (event: MediaQueryListEvent) => void) => {
      listeners.delete(callback);
    },
    dispatchEvent: () => true,
  }));

  const emit = (nextDark: boolean) => {
    matches = nextDark;
    listeners.forEach((listener) => listener({ matches: nextDark } as MediaQueryListEvent));
  };

  return { matchMedia, emit };
}

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('carrega tema salvo no localStorage', async () => {
    const media = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', media.matchMedia);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('usa tema do sistema quando preferencia e system', async () => {
    const media = createMatchMediaMock(true);
    vi.stubGlobal('matchMedia', media.matchMedia);
    localStorage.setItem(THEME_STORAGE_KEY, 'system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persiste nova preferencia ao trocar tema', async () => {
    const media = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', media.matchMedia);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setTheme('dark');
    });

    await waitFor(() => expect(result.current.theme).toBe('dark'));

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('atualiza tema resolvido quando o sistema muda', async () => {
    const media = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', media.matchMedia);
    localStorage.setItem(THEME_STORAGE_KEY, 'system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.resolvedTheme).toBe('light');

    act(() => {
      media.emit(true);
    });

    await waitFor(() => expect(result.current.resolvedTheme).toBe('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignora valor invalido salvo e volta para light', async () => {
    const media = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', media.matchMedia);
    localStorage.setItem(THEME_STORAGE_KEY, 'neon' as string);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
