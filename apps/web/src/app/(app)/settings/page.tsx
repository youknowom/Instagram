'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  ShieldAlert,
  Clock,
  Key,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fadeUp, springGentle } from '@/lib/motion';

export default function SettingsPage() {
  const [livePublish, setLivePublish] = React.useState(false);
  const [requireApproval, setRequireApproval] = React.useState(true);
  const [maxPostsPerDay, setMaxPostsPerDay] = React.useState(2);
  const [timezone, setTimezone] = React.useState('Asia/Kolkata');
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Settings & Safeguards"
        description="Configure Instagram credentials, publishing limits, and safety switches"
      />

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Instagram Account Integration */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={springGentle}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <InstagramIcon className="h-5 w-5 text-accent-400" />
                  Instagram Account Status
                </CardTitle>
                <Badge variant="success">Standard Access Active</Badge>
              </div>
              <CardDescription>
                Meta Developer App linked via Instagram Login (Graph API v26.0)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-4 space-y-1">
                  <span className="text-surface-600">Connected Account</span>
                  <p className="text-sm font-semibold text-surface-950 font-display">
                    @your_creator_page
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Professional Creator Account
                  </p>
                </div>
                <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-4 space-y-1">
                  <span className="text-surface-600">Long-Lived Token Lifespan</span>
                  <p className="text-sm font-semibold text-surface-950 font-display">
                    52 Days Remaining
                  </p>
                  <p className="text-[11px] text-surface-600">Auto-refresh every 7 days</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Test Token Health
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safety Switches */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1, ...springGentle }}
        >
          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                Publishing Safeguards
              </CardTitle>
              <CardDescription>
                Zero-risk controls ensuring no unwanted posts are published to your live Instagram
                profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dry-run Switch */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-xl">
                  <p className="text-sm font-semibold text-surface-950">Live Publishing Mode</p>
                  <p className="text-xs text-surface-700">
                    When disabled, the engine executes full validation and storage upload but
                    dry-runs without publishing to your actual Instagram feed.
                  </p>
                </div>
                <button
                  onClick={() => setLivePublish(!livePublish)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    livePublish ? 'bg-accent-500' : 'bg-surface-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      livePublish ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Approval requirement */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-300">
                <div className="space-y-0.5 max-w-xl">
                  <p className="text-sm font-semibold text-surface-950">Require Owner Approval</p>
                  <p className="text-xs text-surface-700">
                    All AI-generated cards pause in `pending_approval` until you review them in the
                    Queue.
                  </p>
                </div>
                <button
                  onClick={() => setRequireApproval(!requireApproval)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    requireApproval ? 'bg-accent-500' : 'bg-surface-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      requireApproval ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Rate Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-700">Max Posts Per Day</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxPostsPerDay}
                    onChange={(e) => setMaxPostsPerDay(parseInt(e.target.value) || 2)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-surface-600">
                    Meta allows max 100/day, recommended 2-3
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-700">
                    Automation Timezone
                  </label>
                  <Input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-surface-600">
                    Used for calculating peak engagement slots
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Settings saved successfully
            </span>
          )}
          <Button variant="accent" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
