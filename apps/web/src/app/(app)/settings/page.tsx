'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fadeUp, springGentle } from '@/lib/motion';

interface ConnectionStatus {
  connected: boolean;
  userId: string | null;
  username: string | null;
  name?: string | null;
  accountType?: string | null;
  profilePictureUrl?: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const errorParam = searchParams.get('error');

  const [livePublish, setLivePublish] = React.useState(false);
  const [requireApproval, setRequireApproval] = React.useState(true);
  const [maxPostsPerDay, setMaxPostsPerDay] = React.useState(2);
  const [timezone, setTimezone] = React.useState('UTC');
  const [isSaved, setIsSaved] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [connection, setConnection] = React.useState<ConnectionStatus>({
    connected: false,
    userId: null,
    username: null,
    daysRemaining: null,
    expiresAt: null,
  });

  const fetchStatus = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/auth/instagram/status');
      if (res.ok) {
        const data = await res.json();
        setConnection(data);
      }
    } catch {
      // silent fallback
    } finally {
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  React.useEffect(() => {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(`/api/settings?timezone=${encodeURIComponent(localTimezone)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load settings');
        setLivePublish(data.settings.livePublishEnabled);
        setRequireApproval(data.settings.requireApproval);
        setMaxPostsPerDay(data.settings.maxPostsPerDay);
        setTimezone(data.settings.timezone);
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not load settings'));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livePublishEnabled: livePublish,
          requireApproval,
          maxPostsPerDay,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settings could not be saved');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Settings could not be saved');
    } finally {
      setIsSaving(false);
    }
  };

  const isConnected = connection.connected;
  const displayUsername = connection.username;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Success Notification Banner */}
      {statusParam === 'connected' && isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-success/20 text-success flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">Instagram Account Connected!</p>
              <p className="text-xs text-success/80">
                PostPilot is now authorized to create and publish content on behalf of{' '}
                {displayUsername}.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Notification Banner */}
      {errorParam && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-lg bg-error/20 text-error flex items-center justify-center">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-error">Connection Failed</p>
            <p className="text-xs text-error/80">{errorParam}</p>
          </div>
        </motion.div>
      )}

      {/* Instagram Account Integration */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={springGentle}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <InstagramIcon className="h-5 w-5 text-accent-400" />
                Instagram Account Integration
              </CardTitle>
              {isConnected ? (
                <Badge variant="success">Connected & Active</Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>
            <CardDescription>
              Connect your Instagram Professional or Creator account to enable one-click publishing
              and automated workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isConnected ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-4 space-y-1">
                    <span className="text-surface-600">Connected Account</span>
                    <p className="text-sm font-semibold text-surface-950 font-display">
                      {displayUsername || 'Instagram account'}
                    </p>
                    <p className="text-[11px] text-success font-medium">
                      {connection.accountType || 'Connected Instagram account'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-surface-300 bg-surface-200/50 p-4 space-y-1">
                    <span className="text-surface-600">Long-Lived Token Lifespan</span>
                    <p className="text-sm font-semibold text-surface-950 font-display">
                      {connection.daysRemaining === null
                        ? 'Expiry unavailable'
                        : `${connection.daysRemaining} Days Remaining`}
                    </p>
                    <p className="text-[11px] text-surface-600">
                      Expiry is read from the saved Instagram token
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={fetchStatus}
                    disabled={isChecking}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
                    Test Token Health
                  </Button>

                  <a href="/api/auth/instagram">
                    <Button variant="outline" size="sm" className="text-xs">
                      Re-connect Account
                    </Button>
                  </a>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-surface-300 bg-surface-100/50 p-6 flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <InstagramIcon className="h-6 w-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-sm font-semibold text-surface-950">
                    Connect your Instagram Account
                  </h4>
                  <p className="text-xs text-surface-600">
                    Authenticate securely through Meta to let PostPilot publish scheduled content,
                    analyze engagement, and handle approvals.
                  </p>
                </div>
                <a href="/api/auth/instagram">
                  <Button variant="accent" className="gap-2">
                    <InstagramIcon className="h-4 w-4" />
                    Connect with Instagram
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Button>
                </a>
              </div>
            )}
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
              <ShieldAlert className="h-5 w-5 text-warning" />
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
                  When disabled, posts stay in your queue and publishing actions are blocked.
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
                  The limit applies to queued and published posts for the selected day.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-700">Automation Timezone</label>
                <Input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-surface-600">
                  Used when applying your daily post limit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saveError && (
          <span role="alert" className="text-xs text-error">
            {saveError}
          </span>
        )}
        {isSaved && (
          <span className="text-xs text-success flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Settings saved successfully
          </span>
        )}
        <Button variant="accent" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Saving…' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Settings & Safeguards"
        description="Configure Instagram credentials, publishing limits, and safety switches"
      />
      <React.Suspense
        fallback={
          <div className="p-8 text-center text-xs text-surface-500">Loading settings...</div>
        }
      >
        <SettingsContent />
      </React.Suspense>
    </div>
  );
}
