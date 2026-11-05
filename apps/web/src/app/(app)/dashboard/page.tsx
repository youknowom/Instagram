'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Image as ImageIcon,
  ListTodo,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Clock3,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardPost {
  id: string;
  media_type: string;
  caption: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  media_paths: string[];
  meta: Record<string, string> | null;
}

interface DashboardData {
  connected: boolean;
  profile: {
    username: string | null;
    followers: number | null;
    following: number | null;
    mediaCount: number | null;
    connected: boolean;
    error?: string;
  } | null;
  stats: { queuedPosts: number; publishedPosts: number; totalPosts: number };
  recentPosts: DashboardPost[];
  snapshots: Array<{ taken_at: string; followers: number | null }>;
}

const number = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : value.toLocaleString();

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/stats', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Dashboard data could not be loaded');
      setData(result);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const connected = Boolean(data?.connected && data.profile?.connected);
  const chartData = (data?.snapshots || []).map((snapshot) => ({
    date: new Date(snapshot.taken_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    followers: snapshot.followers,
  }));

  return (
    <div className="min-h-screen bg-surface-0 pb-16">
      <Header
        title="Dashboard"
        description="Live overview of your Instagram account and publishing queue"
      />

      <div className="mx-auto max-w-7xl space-y-7 p-6 md:p-8">
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-surface-300 bg-surface-100 p-6 md:flex-row md:items-center md:p-8">
          <div className="space-y-2">
            <Badge variant={connected ? 'success' : 'outline'}>
              {connected ? 'Instagram connected' : 'Instagram not connected'}
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight text-surface-950 md:text-3xl">
              {connected && data?.profile?.username
                ? `Welcome, ${data.profile.username}`
                : 'Connect your Instagram account'}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-surface-700">
              {connected
                ? 'Your account metrics are fetched from Instagram. Queue and publishing activity are loaded from your saved posts.'
                : 'Connect a professional or creator account to load live profile metrics and manage its posts.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {connected ? (
              <Button variant="outline" onClick={fetchDashboard} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh data
              </Button>
            ) : (
              <Link href="/settings">
                <Button variant="accent">
                  Connect Instagram
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/workspace">
              <Button variant="accent">
                <Sparkles className="h-4 w-4" />
                Create a post
              </Button>
            </Link>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        )}
        {data?.profile?.error && (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Instagram profile metrics could not refresh: {data.profile.error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Followers', value: number(data?.profile?.followers), icon: Users },
            { label: 'Following', value: number(data?.profile?.following), icon: Users },
            { label: 'Instagram media', value: number(data?.profile?.mediaCount), icon: ImageIcon },
            { label: 'Posts in queue', value: number(data?.stats.queuedPosts), icon: ListTodo },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-700">
                    {metric.label}
                  </p>
                  <p className="font-display text-2xl font-bold tracking-tight text-surface-950">
                    {loading && !data ? '…' : metric.value}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-300 bg-surface-200 p-2.5 text-surface-700">
                  <metric.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Follower history</CardTitle>
              <CardDescription>
                Daily snapshots collected when this dashboard refreshes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="followerFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-surface-600)"
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-surface-600)"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface-100)',
                          border: '1px solid var(--color-surface-300)',
                          borderRadius: 10,
                          color: 'var(--color-surface-950)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="followers"
                        stroke="#ec4899"
                        strokeWidth={2}
                        fill="url(#followerFill)"
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                  <Users className="h-8 w-8 text-surface-600" />
                  <p className="text-sm font-medium text-surface-900">No follower snapshots yet</p>
                  <p className="max-w-sm text-xs text-surface-600">
                    A real snapshot is saved after Instagram returns profile metrics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Publishing activity</CardTitle>
              <CardDescription>Counts from your saved posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-50 p-4">
                <span className="flex items-center gap-2 text-sm text-surface-800">
                  <Clock3 className="h-4 w-4 text-accent-500" />
                  Queued for review or publishing
                </span>
                <strong className="font-display text-lg text-surface-950">
                  {number(data?.stats.queuedPosts)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-50 p-4">
                <span className="flex items-center gap-2 text-sm text-surface-800">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Published by this app
                </span>
                <strong className="font-display text-lg text-surface-950">
                  {number(data?.stats.publishedPosts)}
                </strong>
              </div>
              <Link
                href="/queue"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:underline"
              >
                Open publishing queue <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent posts</CardTitle>
              <CardDescription>Latest posts saved for this Instagram account</CardDescription>
            </div>
            <Link href="/queue">
              <Button variant="outline" size="sm">
                View queue
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentPosts.length ? (
              <div className="divide-y divide-surface-300">
                {data.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    {post.media_paths?.[0] ? (
                      <img
                        src={post.media_paths[0]}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-200 text-surface-600">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-950">
                        {post.meta?.quote || post.caption || 'Untitled post'}
                      </p>
                      <p className="mt-1 text-xs text-surface-600">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={post.status === 'posted' ? 'success' : 'outline'}>
                      {post.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-surface-900">No saved posts yet</p>
                <p className="mt-1 text-xs text-surface-600">
                  Create a post to see its status here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
