import { ArrowUpRight, FileText, MoonStar, SunMedium } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ThemeMode } from '@/types/resume';

const navItems = [
  { label: 'Home', href: '#top' },
  { label: 'Workflow', href: '#how-it-works' },
  { label: 'Results', href: '#results' },
];

type NavbarProps = {
  theme: ThemeMode;
  onThemeToggle: () => void;
};

export function Navbar({ theme, onThemeToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">AI Resume Analyzer</p>
            <p className="text-xs text-muted-foreground">ATS insights for modern hiring</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="shrink-0"
            onClick={onThemeToggle}
            size="icon"
            variant="outline"
          >
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" className="shrink-0">
            GitHub
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  );
}
