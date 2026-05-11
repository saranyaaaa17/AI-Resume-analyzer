import { useEffect, useState } from 'react';

import { Home } from '@/pages/Home';
import type { ThemeMode } from '@/types/resume';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem('theme');

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return <Home onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} theme={theme} />;
}
