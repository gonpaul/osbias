'use client';

import { useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  return stored ?? null;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : theme;
  
  if (resolved === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.remove('theme-light');
  }
}

export function useTheme() {
  const setTheme = useCallback((theme: Theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }, []);

  const getTheme = useCallback((): Theme => {
    return getStoredTheme() ?? 'system';
  }, []);

  useEffect(() => {
    // Apply theme on mount
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
    } else {
      // Default to system preference if no stored value
      applyTheme('system');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const current = getStoredTheme();
      if (!current || current === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { theme: getTheme(), setTheme };
}