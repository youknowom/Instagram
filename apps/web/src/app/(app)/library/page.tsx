'use client';

import * as React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LibraryAsset {
  id: string;
  title: string;
  provider: string;
  url: string;
  tags: string[];
  createdAt: string;
}

export default function LibraryPage() {
  const [assets, setAssets] = React.useState<LibraryAsset[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAssets = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/library', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Media library could not be loaded');
      setAssets(result.assets);
      setError(null);
    } catch (cause) {
      setAssets([]);
      setError(cause instanceof Error ? cause.message : 'Media library could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = assets.filter((asset) =>
    `${asset.title} ${asset.provider} ${asset.tags.join(' ')}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Media Library"
        description="Media saved from your own posts and uploaded assets"
      />
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-surface-300 pb-5 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-600" />
            <Input
              placeholder="Search saved media…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAssets} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Link href="/workspace">
              <Button variant="accent" size="sm">
                Find visuals
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          >
            <span>{error}</span>
            {error.toLowerCase().includes('connect') && (
              <Link href="/settings" className="font-semibold underline">
                Connect Instagram
              </Link>
            )}
          </div>
        )}

        {filteredAssets.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="group overflow-hidden transition-colors hover:border-surface-400"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-200">
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open media"
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-xs font-semibold text-surface-950">
                    {asset.title}
                  </p>
                  <p className="text-[10px] text-surface-600">
                    {asset.provider} · {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[9px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <ImageIcon className="h-10 w-10 text-surface-600" />
              <p className="text-sm font-medium text-surface-900">
                {assets.length ? 'No saved media matches your search' : 'Your library is empty'}
              </p>
              <p className="max-w-sm text-xs text-surface-600">
                Images used in saved posts will appear here. Search live visuals in the workspace to
                start a post.
              </p>
              <Link href="/workspace">
                <Button variant="accent" size="sm">
                  Open workspace
                </Button>
              </Link>
            </div>
          )
        )}
        {loading && (
          <p className="py-10 text-center text-sm text-surface-600">Loading saved media…</p>
        )}
      </div>
    </div>
  );
}
