'use client';

import { useTranslations } from 'next-intl';
import { useTheme, type ThemePreference } from '@/lib/theme';

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  icon: string;
}> = [
  { value: 'system', icon: '💻' },
  { value: 'light', icon: '☀️' },
  { value: 'dark', icon: '🌙' },
];

/**
 * Theme switcher com suporte a system/light/dark.
 */
export default function ThemeSwitcher() {
  const t = useTranslations('theme');
  const { theme, resolvedTheme, setTheme, isReady } = useTheme();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
      role="group"
      aria-label={t('label')}
    >
      {THEME_OPTIONS.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            aria-pressed={isActive}
            aria-label={t(option.value)}
            title={t(option.value)}
            disabled={!isReady}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span className="hidden sm:inline">{t(option.value)}</span>
          </button>
        );
      })}
      <span className="sr-only">{t('current', { theme: t(theme), resolved: t(resolvedTheme) })}</span>
    </div>
  );
}
