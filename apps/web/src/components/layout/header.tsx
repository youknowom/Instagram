'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  description?: string;
}

interface InstagramStatus {
  connected: boolean;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
}

export function Header({ title, description }: HeaderProps) {
  const [profile, setProfile] = React.useState<InstagramStatus | null>(null);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(current);

    fetch('/api/auth/instagram/status', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => setProfile(null));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('postpilot-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-4 border-b border-surface-300 bg-surface-0/95 px-5 backdrop-blur md:px-7">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-surface-950">{title}</h1>
        {description && (
          <p className="hidden truncate text-xs text-surface-700 sm:block">{description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-700 transition-colors hover:bg-surface-200 hover:text-surface-950"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-700 transition-colors hover:bg-surface-200 hover:text-surface-950"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-500" />
        </button>

        {profile?.connected ? (
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-200"
            title="Instagram account settings"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-surface-300 bg-surface-200">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-surface-800">
                  {profile.username?.replace('@', '').slice(0, 1).toUpperCase() || 'IG'}
                </span>
              )}
            </span>
            <span className="hidden max-w-36 flex-col text-left leading-tight sm:flex">
              <span className="truncate text-xs font-semibold text-surface-950">
                {profile.username || 'Instagram account'}
              </span>
              <span className="text-[10px] text-surface-600">Connected account</span>
            </span>
            <Badge variant="success" className="hidden px-1.5 py-0 text-[9px] md:inline-flex">
              Live
            </Badge>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-accent-600 hover:bg-surface-200"
          >
            Connect Instagram
          </Link>
        )}
      </div>
    </header>
  );
}
