import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY } from '@/lib/theme-constants';

/**
 * Script anti-flash para aplicar tema antes da hidratação do React.
 */
export function getThemeInitScript() {
  const safeKey = JSON.stringify(THEME_STORAGE_KEY);
  const safeMediaQuery = JSON.stringify(THEME_MEDIA_QUERY);

  return `
(function () {
  try {
    var storageKey = ${safeKey};
    var mediaQuery = ${safeMediaQuery};
    var storedTheme = localStorage.getItem(storageKey);
    var isValidTheme = storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark';
    var themePreference = isValidTheme ? storedTheme : 'system';
    var systemDark = window.matchMedia(mediaQuery).matches;
    var resolvedTheme = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference;
    var root = document.documentElement;

    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  } catch (_error) {
    // Fail-safe: mantém o render inicial sem quebrar a página.
  }
})();`;
}
