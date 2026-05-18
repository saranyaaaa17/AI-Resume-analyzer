import { ArrowUpRight, FileText, MoonStar, ShieldCheck, SunMedium, UserCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RefreshTokensPanel from '@/components/admin/RefreshTokensPanel';
import { useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/lib/api';
import type { ThemeMode } from '@/types/resume';
import { fetchCurrentUser, getAuthToken, logout } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

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
  const [email, setEmail] = useState('');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { token, user, initialized, initializeFromStorage, setToken, setUser, clearAuth } = useAuthStore();
  const [showTokens, setShowTokens] = useState(false);
  const signInPanelRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initializeFromStorage();
    // if no token, try to refresh from cookie (useful after OAuth redirect)
    void (async () => {
      if (!window.localStorage.getItem('auth_token')) {
        try {
          await (useAuthStore.getState().tryRefreshFromCookie?.() as Promise<void>);
          const tok = window.localStorage.getItem('auth_token');
          if (tok) {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
          }
        } catch (e) {
          // ignore
        }
      }
    })();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (!initialized || !token || user) return;

    void fetchCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => clearAuth());
  }, [clearAuth, initialized, setUser, token, user]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (signInPanelRef.current && !signInPanelRef.current.contains(event.target as Node)) {
        setIsSignInOpen(false);
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSignInOpen(false);
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSignInOpen]);

  const handleLogin = async () => {
    if (!email) return;
    try {
      const res = await getAuthToken(email);
      if (res?.access_token) {
        setToken(res.access_token);
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setIsSignInOpen(false);
      }
    } catch (err) {
      clearAuth();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    clearAuth();
  };
  const RefreshTokensButton = useCallback(() => (
    <Button size="sm" variant="ghost" onClick={() => setShowTokens(true)}>Manage tokens</Button>
  ), []);
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

        <div className="relative flex items-center gap-2">
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
          {token && user ? (
            <div className="relative" ref={accountMenuRef}>
              <Button
                aria-expanded={isAccountMenuOpen}
                aria-label="Open account menu"
                className="h-11 rounded-full border border-border/70 bg-card px-3.5 text-sm text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-background"
                onClick={() => setIsAccountMenuOpen((value) => !value)}
                variant="outline"
              >
                <UserCircle2 className="h-4 w-4" />
                <span className="max-w-[190px] truncate">{user.email}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.role}
                </span>
              </Button>
              {isAccountMenuOpen ? (
                <Card className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden border-border/70 bg-card/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <CardHeader className="border-b border-border/60 bg-gradient-to-b from-background/80 to-transparent pb-3">
                    <CardTitle className="text-base">Account</CardTitle>
                    <CardDescription className="mt-1">Signed in as {user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                      Role: <span className="font-semibold text-foreground">{user.role}</span>
                    </div>
                    {user.role === 'admin' ? (
                      <div className="space-y-2">
                        <RefreshTokensButton />
                      </div>
                    ) : null}
                    <Button className="w-full shadow-none" onClick={handleLogout} size="sm" variant="outline">
                      Sign out
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              {showTokens ? (
                <div className="absolute right-0 top-[calc(100%+4.5rem)] z-50">
                  <RefreshTokensPanel onClose={() => setShowTokens(false)} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative" ref={signInPanelRef}>
              <Button size="sm" onClick={() => setIsSignInOpen((value) => !value)}>Sign in</Button>
              {isSignInOpen ? (
                <Card className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[22rem] overflow-hidden border-border/70 bg-card/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <CardHeader className="border-b border-border/60 bg-gradient-to-b from-background/80 to-transparent pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription className="mt-1">Use your email to mint a local dev token.</CardDescription>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setIsSignInOpen(false)} aria-label="Close sign in panel">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        <div>
                          <a href={`${API_BASE_URL}/auth/google/login`}>
                            <Button size="sm" variant="ghost" className="w-full">Sign in with Google</Button>
                          </a>
                        </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground" htmlFor="auth-email">Email</label>
                      <input
                        id="auth-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void handleLogin();
                          }
                        }}
                        placeholder="you@company.com"
                        className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-muted-foreground">A token will be stored locally and reused for protected API requests.</p>
                      <Button size="sm" onClick={() => void handleLogin()} variant="secondary">Continue</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <Separator />
    </header>
  );
}
