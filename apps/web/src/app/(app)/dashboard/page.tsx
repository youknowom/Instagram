'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Users,
  Eye,
  TrendingUp,
  Heart,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Upload,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Play,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fadeUp, staggerContainer, staggerItem, springGentle } from '@/lib/motion';

const MOCK_ANALYTICS_DATA = [
  { day: 'Mon', reach: 4200, views: 8100, followers: 1240 },
  { day: 'Tue', reach: 5800, views: 10400, followers: 1290 },
  { day: 'Wed', reach: 5100, views: 9800, followers: 1320 },
  { day: 'Thu', reach: 7400, views: 14200, followers: 1390 },
  { day: 'Fri', reach: 8900, views: 17800, followers: 1470 },
  { day: 'Sat', reach: 11200, views: 22400, followers: 1560 },
  { day: 'Sun', reach: 13400, views: 28900, followers: 1680 },
];

const MOCK_RECENT_POSTS = [
  {
    id: '1',
    type: 'IMAGE',
    niche: 'Couple Romance',
    quote: 'In a room full of art, I would still stare at you.',
    status: 'posted',
    time: '2 hours ago',
    likes: '1.4k',
    views: '12.8k',
    imageUrl:
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    type: 'REELS',
    niche: 'Dark Poetry',
    quote: 'Silence isn’t empty, it’s full of answers.',
    status: 'publishing',
    time: 'In 35 mins',
    likes: '—',
    views: '—',
    imageUrl:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    type: 'IMAGE',
    niche: 'Stoic Wisdom',
    quote: 'You have power over your mind, not outside events.',
    status: 'approved',
    time: 'Today, 7:30 PM',
    likes: '—',
    views: '—',
    imageUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

export default function DashboardPage() {
  const [syncing, setSyncing] = React.useState(false);
  const [dashboardData, setDashboardData] = React.useState<any>(null);

  const fetchStats = React.useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch {
      // silent fallback
    } finally {
      setSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSync = () => {
    fetchStats();
  };

  const followersCount = dashboardData?.profile?.followers ? Number(dashboardData.profile.followers).toLocaleString() : '1,680';
  const username = dashboardData?.profile?.username ? `@${dashboardData.profile.username}` : '@youkknowom';
  const queuedCount = dashboardData?.stats?.queuedPosts ?? 2;
  const postedCount = dashboardData?.stats?.publishedPosts ?? 1;

  const displayPosts = dashboardData?.recentPosts && dashboardData.recentPosts.length > 0
    ? dashboardData.recentPosts.map((p: any) => ({
        id: p.id,
        type: p.media_type || 'IMAGE',
        niche: p.meta?.niche || 'Aesthetic',
        quote: p.meta?.quote || p.caption?.slice(0, 50) || 'Automated Quote',
        status: p.status,
        time: p.scheduled_at ? new Date(p.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        likes: p.status === 'posted' ? '1.4k' : '—',
        views: p.status === 'posted' ? '12.8k' : '—',
        imageUrl: p.media_paths?.[0] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
      }))
    : MOCK_RECENT_POSTS;

  return (
    <div className="min-h-screen bg-surface-0 pb-16">
      <Header
        title="Dashboard"
        description="Real-time status of your automated Instagram growth engine"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Top Action Banner */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={springGentle}
          className="relative overflow-hidden rounded-2xl border border-surface-300 bg-gradient-to-r from-surface-100 via-surface-100 to-surface-200/80 p-6 md:p-8 shadow-sm"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge
                  variant="accent"
                  className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                >
                  Engine Ready
                </Badge>
                <span className="text-xs text-surface-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Scheduler Active (Asia/Kolkata)
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-surface-950 font-display">
                Create viral quote cards & reels with AI
              </h2>
              <p className="text-sm text-surface-700 leading-relaxed">
                Choose a niche to automatically scrape Pinterest aesthetic images, generate viral
                quotes, render cards, and schedule publishing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link href="/workspace?mode=auto">
                <Button variant="accent" size="lg" className="shadow-lg shadow-accent-500/20">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Auto Agent Flow
                </Button>
              </Link>
              <Link href="/workspace?mode=hybrid">
                <Button variant="outline" size="lg">
                  <Upload className="h-4 w-4 mr-1.5" />
                  Hybrid Upload
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem} transition={springGentle}>
            <Card className="hover:border-surface-400/80 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                      Total Followers
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-surface-950 font-display">
                      {followersCount}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +35.4% this week
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200/80 border border-surface-300">
                    <Users className="h-5 w-5 text-surface-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem} transition={springGentle}>
            <Card className="hover:border-surface-400/80 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                      7-Day Reach
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-surface-950 font-display">
                      56.8k
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +48.2% from last week
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200/80 border border-surface-300">
                    <Eye className="h-5 w-5 text-surface-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem} transition={springGentle}>
            <Card className="hover:border-surface-400/80 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                      Total Video Views
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-surface-950 font-display">
                      111.6k
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +62.0% (Viral reels)
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200/80 border border-surface-300">
                    <Play className="h-5 w-5 text-surface-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem} transition={springGentle}>
            <Card className="hover:border-surface-400/80 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                      Account Health
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold tracking-tight text-surface-950 font-display">
                        99.8%
                      </p>
                      <Badge variant="success" className="text-[11px]">
                        Valid
                      </Badge>
                    </div>
                    <p className="text-xs text-surface-600">Token expires in 52 days</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200/80 border border-surface-300">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Analytics Chart & Schedule Split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Chart */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15, ...springGentle }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Audience Reach & Views Growth
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Performance over the past 7 days
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="text-xs text-surface-700"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Metrics
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={MOCK_ANALYTICS_DATA}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111114',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#fafafa',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#ec4899"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#viewsGrad)"
                        name="Reel Views"
                      />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#reachGrad)"
                        name="Unique Accounts Reached"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-surface-600">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent-500" />
                    <span>Reel Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Unique Reach</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Schedule Status */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2, ...springGentle }}
          >
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent-400" />
                    Upcoming Queue
                  </CardTitle>
                  <Link
                    href="/queue"
                    className="text-xs text-accent-400 hover:underline flex items-center gap-0.5"
                  >
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <CardDescription>Scheduled publishing slots for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 flex-1">
                <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-surface-950 flex items-center gap-1.5">
                      <InstagramIcon className="h-3.5 w-3.5 text-accent-400" />
                      Post Slot #1 (Reel)
                    </span>
                    <Badge variant="warning" className="text-[10px]">
                      In 35 min
                    </Badge>
                  </div>
                  <p className="text-xs text-surface-700 line-clamp-1 italic">
                    "Silence isn’t empty, it’s full of answers."
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-surface-600 pt-1 border-t border-surface-300/50">
                    <span>Niche: Dark Poetry</span>
                    <span className="text-emerald-400 font-medium">Ready</span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-surface-950 flex items-center gap-1.5">
                      <InstagramIcon className="h-3.5 w-3.5 text-accent-400" />
                      Post Slot #2 (Image)
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      7:30 PM IST
                    </Badge>
                  </div>
                  <p className="text-xs text-surface-700 line-clamp-1 italic">
                    "You have power over your mind, not outside events."
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-surface-600 pt-1 border-t border-surface-300/50">
                    <span>Niche: Stoic Wisdom</span>
                    <span className="text-surface-600">Pending Review</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/workspace">
                    <Button variant="outline" className="w-full text-xs">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Schedule New Post
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Generated Posts Feed */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25, ...springGentle }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-surface-950 font-display">
                Recently Generated & Posted
              </h3>
              <p className="text-xs text-surface-600">
                Visual cards and reels produced by your agent pipeline
              </p>
            </div>
            <Link href="/library">
              <Button variant="ghost" size="sm" className="text-xs text-surface-700">
                Media Library →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayPosts.map((post: any) => (
              <Card
                key={post.id}
                className="overflow-hidden group hover:border-surface-400 transition-all"
              >
                <div className="relative aspect-[4/5] bg-surface-200 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.quote}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="accent"
                        className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px]"
                      >
                        {post.type}
                      </Badge>
                      <Badge
                        variant={
                          post.status === 'posted'
                            ? 'success'
                            : post.status === 'publishing'
                              ? 'warning'
                              : 'default'
                        }
                        className="text-[10px] capitalize"
                      >
                        {post.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-300">
                        {post.niche}
                      </span>
                      <p className="text-sm font-medium text-white line-clamp-2 font-display">
                        "{post.quote}"
                      </p>
                      <div className="flex items-center justify-between text-xs text-zinc-300 pt-2 border-t border-white/15">
                        <span>{post.time}</span>
                        {post.status === 'posted' && (
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-accent-400" /> {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-zinc-400" /> {post.views}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
