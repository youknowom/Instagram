'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fadeUp, springGentle } from '@/lib/motion';

interface PostItem {
  id: string;
  source: string;
  mediaType: string;
  niche: string | null;
  quote: string;
  caption: string;
  scheduledAt: string | null;
  status: string;
  imageUrl: string | null;
  igPermalink: string | null;
  error: string | null;
}

interface ApiPost {
  id: string;
  source: string;
  media_type: string;
  meta: Record<string, string> | null;
  caption: string;
  scheduled_at: string | null;
  status: string;
  media_paths: string[];
  ig_permalink: string | null;
  error: string | null;
}

const FILTERS = ['all', 'pending_approval', 'approved', 'publishing', 'posted', 'failed'];

export default function QueuePage() {
  const [filter, setFilter] = React.useState('all');
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [publishingId, setPublishingId] = React.useState<string | null>(null);

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const data: { error?: string; posts?: ApiPost[] } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Queue could not be loaded');
      setPosts(
        (data.posts || []).map((post) => ({
          id: post.id,
          source: post.source,
          mediaType: post.media_type,
          niche: post.meta?.niche || null,
          quote: post.meta?.quote || '',
          caption: post.caption || '',
          scheduledAt: post.scheduled_at,
          status: post.status,
          imageUrl: post.media_paths?.[0] || null,
          igPermalink: post.ig_permalink || null,
          error: post.error || null,
        })),
      );
      setError(null);
    } catch (cause) {
      setPosts([]);
      setError(cause instanceof Error ? cause.message : 'Queue could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) => filter === 'all' || post.status === filter);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Post could not be approved');
      await fetchPosts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Post could not be approved');
    }
  };

  const handlePublishNow = async (id: string) => {
    setPublishingId(id);
    try {
      const response = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Publishing failed');
      await fetchPosts();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Publishing failed';
      await fetchPosts();
      setError(message);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Post could not be deleted');
      await fetchPosts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Post could not be deleted');
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Publishing Queue"
        description="Review saved posts and publish them to your connected Instagram account"
      />
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-surface-300 pb-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-surface-300 bg-surface-100 p-1 text-xs">
            {FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${filter === tab ? 'bg-surface-950 text-surface-0 shadow-sm' : 'text-surface-700 hover:text-surface-950'}`}
              >
                {tab.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchPosts} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Link href="/workspace">
              <Button variant="accent" size="sm">
                <Sparkles className="h-3.5 w-3.5" /> New post
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
                <Card className="overflow-hidden transition-colors hover:border-surface-400">
                  <div className="flex flex-col items-start gap-5 p-5 sm:flex-row sm:items-center">
                    <div className="relative flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-surface-300 bg-surface-200">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.quote || 'Post media'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-surface-600" />
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                        {post.mediaType}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.niche && (
                          <Badge variant="accent" className="text-[10px]">
                            {post.niche}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            post.status === 'posted'
                              ? 'success'
                              : post.status === 'failed'
                                ? 'error'
                                : post.status === 'pending_approval'
                                  ? 'warning'
                                  : 'outline'
                          }
                          className="capitalize"
                        >
                          {post.status.replaceAll('_', ' ')}
                        </Badge>
                        {post.scheduledAt && (
                          <span className="flex items-center gap-1 text-xs text-surface-600">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-1 font-display text-sm font-semibold text-surface-950">
                        {post.quote || post.caption || 'Untitled post'}
                      </p>
                      <p className="line-clamp-2 text-xs text-surface-700">{post.caption}</p>
                      {post.error && <p className="text-xs text-error">{post.error}</p>}
                      {post.igPermalink && (
                        <a
                          href={post.igPermalink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent-600 underline"
                        >
                          View on Instagram
                        </a>
                      )}
                    </div>
                    <div className="flex w-full shrink-0 items-center gap-2 border-t border-surface-300 pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      {post.status === 'pending_approval' && (
                        <Button variant="accent" size="sm" onClick={() => handleApprove(post.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      {post.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={publishingId === post.id}
                          onClick={() => handlePublishNow(post.id)}
                        >
                          {publishingId === post.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <InstagramIcon className="h-3.5 w-3.5 text-accent-500" />
                          )}
                          {publishingId === post.id ? 'Publishing…' : 'Publish now'}
                        </Button>
                      )}
                      {post.status === 'posted' && (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Published
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete post"
                        onClick={() => handleDelete(post.id)}
                        className="text-surface-600 hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center">
              <ListTodo className="h-10 w-10 text-surface-600" />
              <p className="text-sm font-medium text-surface-900">
                {posts.length ? 'No posts in this category' : 'Your queue is empty'}
              </p>
              <p className="text-xs text-surface-600">
                Posts saved from the workspace will appear here.
              </p>
              <Link href="/workspace">
                <Button variant="accent" size="sm">
                  Create a post
                </Button>
              </Link>
            </div>
          )}
          {loading && (
            <p className="py-12 text-center text-sm text-surface-600">Loading saved posts…</p>
          )}
        </div>
      </div>
    </div>
  );
}
