'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fadeUp, springGentle } from '@/lib/motion';

interface PostItem {
  id: string;
  source: 'manual' | 'agent';
  mediaType: 'REELS' | 'IMAGE';
  niche: string;
  quote: string;
  caption: string;
  scheduledAt: string;
  status: 'pending_approval' | 'approved' | 'publishing' | 'posted' | 'failed';
  imageUrl: string;
  likes?: string;
  views?: string;
}

const INITIAL_QUEUE: PostItem[] = [
  {
    id: 'q1',
    source: 'agent',
    mediaType: 'REELS',
    niche: 'Dark Poetry',
    quote: 'Silence is not empty. It is full of answers.',
    caption:
      'Late night ruminations. Sometimes the loudest conversations happen in complete stillness. #darkpoetry #cinematic',
    scheduledAt: 'Today, 2:30 PM IST',
    status: 'approved',
    imageUrl:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'q2',
    source: 'agent',
    mediaType: 'IMAGE',
    niche: 'Couple & Romance',
    quote: 'In a room full of art, I would still stare at you.',
    caption:
      'Some connections don’t need words — they just exist in quiet glances and comfortable silences. ✨ #couplelove',
    scheduledAt: 'Today, 7:30 PM IST',
    status: 'pending_approval',
    imageUrl:
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'q3',
    source: 'agent',
    mediaType: 'IMAGE',
    niche: 'Stoic Wisdom',
    quote: 'You have power over your mind, not outside events.',
    caption: 'Mastering the art of indifference toward what you cannot control. #stoic',
    scheduledAt: 'Tomorrow, 10:00 AM IST',
    status: 'approved',
    imageUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'q4',
    source: 'manual',
    mediaType: 'REELS',
    niche: 'Telegram Ingest',
    quote: 'Hybrid Reel Upload',
    caption: 'Weekend aesthetic compilation dropped via Telegram bot.',
    scheduledAt: 'Yesterday, 8:00 PM IST',
    status: 'posted',
    likes: '1.2k',
    views: '14.5k',
    imageUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
  },
];

export default function QueuePage() {
  const [filter, setFilter] = React.useState<string>('all');
  const [posts, setPosts] = React.useState<PostItem[]>(INITIAL_QUEUE);

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleApprove = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Publishing Queue"
        description="Monitor, approve, reschedule and publish posts on schedule"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-300 pb-5">
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-100 p-1 rounded-xl border border-surface-300 text-xs">
            {['all', 'pending_approval', 'approved', 'posted'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  filter === tab
                    ? 'bg-surface-950 text-surface-0 shadow-sm'
                    : 'text-surface-700 hover:text-surface-950'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/workspace">
              <Button variant="accent" size="sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                New Automated Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.98 }}
                transition={springGentle}
              >
                <Card className="overflow-hidden hover:border-surface-400/80 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-24 shrink-0 rounded-lg overflow-hidden bg-surface-200 border border-surface-300">
                      <img
                        src={post.imageUrl}
                        alt={post.quote}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white uppercase">
                        {post.mediaType}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="accent" className="text-[10px] uppercase font-semibold">
                          {post.niche}
                        </Badge>
                        <Badge
                          variant={
                            post.status === 'posted'
                              ? 'success'
                              : post.status === 'approved'
                                ? 'default'
                                : post.status === 'pending_approval'
                                  ? 'warning'
                                  : 'error'
                          }
                          className="text-[10px] capitalize"
                        >
                          {post.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-surface-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.scheduledAt}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-surface-950 font-display line-clamp-1">
                        "{post.quote}"
                      </p>
                      <p className="text-xs text-surface-700 line-clamp-2">{post.caption}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-300">
                      {post.status === 'pending_approval' && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => handleApprove(post.id)}
                          className="text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Approve Post
                        </Button>
                      )}
                      {post.status === 'approved' && (
                        <Button variant="outline" size="sm" className="text-xs text-surface-900">
                          <Play className="h-3 w-3 mr-1" />
                          Publish Now (Live)
                        </Button>
                      )}
                      {post.status === 'posted' && (
                        <div className="flex items-center gap-3 text-xs text-surface-600">
                          <span>{post.likes} likes</span>
                          <span>{post.views} views</span>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-xs text-surface-600 hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <ListTodo className="h-10 w-10 text-surface-600" />
              <p className="text-sm font-medium text-surface-900">No posts in this category</p>
              <Link href="/workspace">
                <Button variant="accent" size="sm">
                  Create a Post Now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
