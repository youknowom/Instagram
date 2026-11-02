'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fadeUp, springGentle } from '@/lib/motion';

const POST_COMPARISON_DATA = [
  { name: 'Romantic 1', format: 'Reel', views: 24200, saves: 840, shares: 320 },
  { name: 'Stoic 1', format: 'Image', views: 8900, saves: 420, shares: 110 },
  { name: 'Poetry 1', format: 'Reel', views: 31000, saves: 1250, shares: 640 },
  { name: 'Anime 1', format: 'Reel', views: 18400, saves: 690, shares: 280 },
  { name: 'Luxury 1', format: 'Image', views: 6700, saves: 310, shares: 85 },
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Audience & Post Insights"
        description="Deep performance breakdown: Reels vs static image cards and viral metrics"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Format Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 space-y-2">
            <span className="text-xs text-surface-600 uppercase font-semibold">
              Reels vs Images Multiplier
            </span>
            <p className="text-3xl font-bold text-surface-950 font-display">3.6x</p>
            <p className="text-xs text-emerald-400 font-medium">
              Reels generate 260% more shares than single images
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <span className="text-xs text-surface-600 uppercase font-semibold">
              Average Saves per Post
            </span>
            <p className="text-3xl font-bold text-surface-950 font-display">702</p>
            <p className="text-xs text-emerald-400 font-medium">
              +18% above industry average for quote pages
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <span className="text-xs text-surface-600 uppercase font-semibold">
              Best Time to Post (IST)
            </span>
            <p className="text-3xl font-bold text-surface-950 font-display">7:30 PM</p>
            <p className="text-xs text-surface-600">
              Peak follower activity window: 6:00 PM – 9:00 PM
            </p>
          </Card>
        </div>

        {/* Views Chart */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={springGentle}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Performing Posts Breakdown</CardTitle>
              <CardDescription>Comparison of views across different niche formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={POST_COMPARISON_DATA}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
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
                    <Bar dataKey="views" fill="#ec4899" radius={[6, 6, 0, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
