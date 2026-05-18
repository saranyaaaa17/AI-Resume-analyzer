import { useEffect } from 'react';

import { PlatformShell } from '@/components/platform/PlatformShell';
import { usePlatformStore } from '@/store/usePlatformStore';
import type { ThemeMode } from '@/types/resume';

export default function App() {
  const theme = usePlatformStore((state) => state.theme);
  const setTheme = usePlatformStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedTheme = window.localStorage.getItem('theme');
    const nextTheme: ThemeMode =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    setTheme(nextTheme);
  }, [setTheme]);

  return <PlatformShell theme={theme} onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />;
}
