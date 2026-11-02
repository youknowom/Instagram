'use client';

import { Bell, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-300 px-6">
      <div>
        <h1 className="text-sm font-semibold text-surface-950">{title}</h1>
        {description && <p className="text-xs text-surface-700">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-500" />
        </button>
      </div>
    </header>
  );
}
