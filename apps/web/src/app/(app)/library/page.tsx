'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Image as ImageIcon,
  FolderPlus,
  Upload,
  Search,
  Filter,
  Check,
  Download,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fadeUp, springGentle } from '@/lib/motion';

const LIBRARY_ASSETS = [
  {
    id: 'a1',
    title: 'Rainy street night reflections',
    provider: 'Pinterest Scraper',
    resolution: '1080x1920',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    tags: ['Dark Poetry', 'Cinema'],
  },
  {
    id: 'a2',
    title: 'Warm film silhouette embrace',
    provider: 'Pinterest Scraper',
    resolution: '1080x1350',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    tags: ['Couple', 'Romance'],
  },
  {
    id: 'a3',
    title: 'Marcus Aurelius marble bust',
    provider: 'Pinterest Scraper',
    resolution: '1080x1350',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    tags: ['Stoicism', 'Philosophy'],
  },
  {
    id: 'a4',
    title: 'Tokyo twilight neon skyline',
    provider: 'Pinterest Scraper',
    resolution: '1080x1920',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    tags: ['Anime', 'Vapourwave'],
  },
];

export default function LibraryPage() {
  const [search, setSearch] = React.useState('');

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Media & Background Library"
        description="Curated Pinterest visuals, custom user uploads, and brand assets"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-300 pb-5">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-600" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Asset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {LIBRARY_ASSETS.map((asset) => (
            <Card
              key={asset.id}
              className="overflow-hidden group hover:border-surface-400 transition-all"
            >
              <div className="relative aspect-[4/5] bg-surface-200 overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-center">
                    <Badge variant="accent" className="text-[9px]">
                      {asset.resolution}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white line-clamp-1">{asset.title}</p>
                    <span className="text-[10px] text-zinc-300">{asset.provider}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
