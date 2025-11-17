export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'chatsystem-theme';

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return prefersDark ? 'dark' : 'light';
};

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = mode;
};

export const persistTheme = (mode: ThemeMode) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
};
