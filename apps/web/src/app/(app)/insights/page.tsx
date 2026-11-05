'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Heart, MessageCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MediaInsight {
  id: string;
  caption: string;
  mediaType: string;
  permalink: string | null;
  timestamp: string | null;
  mediaUrl: string | null;
  likes: number | null;
  comments: number | null;
}

interface InsightsData {
  media: MediaInsight[];
  summary: { posts: number; likes: number; comments: number };
}

export default function InsightsPage() {
  const [data, setData] = React.useState<InsightsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchInsights = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/insights', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Instagram insights could not be loaded');
      setData(result);
      setError(null);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Instagram insights could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const chartData = (data?.media || []).slice(0, 12).map((post) => ({
    post: post.caption.trim().slice(0, 24) || post.mediaType,
    likes: post.likes,
    comments: post.comments,
  }));

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Instagram Insights"
        description="Live engagement data for your recent Instagram media"
      />
      <div className="mx-auto max-w-7xl space-y-7 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-surface-700">
            Metrics below come from the connected Instagram account. Instagram returns media and
            engagement fields available to your account permissions.
          </p>
          <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh data
          </Button>
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

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Recent media fetched', value: data?.summary.posts, icon: BarChart3 },
            { label: 'Likes returned', value: data?.summary.likes, icon: Heart },
            { label: 'Comments returned', value: data?.summary.comments, icon: MessageCircle },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-700">
                    {metric.label}
                  </p>
                  <p className="font-display text-2xl font-bold text-surface-950">
                    {loading && !data
                      ? '…'
                      : metric.value === undefined
                        ? '—'
                        : metric.value.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-300 bg-surface-200 p-2.5 text-surface-700">
                  <metric.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Engagement by recent post</CardTitle>
            <CardDescription>Likes and comments returned directly from Instagram</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -12, right: 8 }}>
                    <XAxis
                      dataKey="post"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-surface-600)"
                      fontSize={11}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-surface-600)"
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-100)',
                        border: '1px solid var(--color-surface-300)',
                        borderRadius: 10,
                        color: 'var(--color-surface-950)',
                      }}
                    />
                    <Bar dataKey="likes" fill="#ec4899" radius={[5, 5, 0, 0]} name="Likes" />
                    <Bar dataKey="comments" fill="#8b5cf6" radius={[5, 5, 0, 0]} name="Comments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-sm text-surface-600">
                {loading
                  ? 'Loading Instagram media…'
                  : 'Instagram has not returned any media for this account yet.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Instagram media</CardTitle>
            <CardDescription>Latest media available through the connected account</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.media.length ? (
              <div className="divide-y divide-surface-300">
                {data.media.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-surface-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-950">
                        {post.caption || post.mediaType}
                      </p>
                      <p className="mt-1 text-xs text-surface-600">
                        {post.timestamp
                          ? new Date(post.timestamp).toLocaleString()
                          : post.mediaType}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-surface-700">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likes === null ? '—' : post.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-surface-700">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments === null ? '—' : post.comments.toLocaleString()}
                    </span>
                    {post.permalink && (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open Instagram post"
                      >
                        <ExternalLink className="h-4 w-4 text-surface-600 hover:text-accent-600" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-surface-600">
                No live media data to display.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
