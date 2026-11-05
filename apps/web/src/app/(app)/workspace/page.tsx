'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Upload,
  Wand2,
  Image as ImageIcon,
  Check,
  Clock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card3DPreview } from '@/components/studio/Card3DPreview';
import { fadeUp } from '@/lib/motion';

export default function WorkspacePage() {
  const [mode, setMode] = React.useState<'auto' | 'hybrid'>('auto');
  const [selectedNiche, setSelectedNiche] = React.useState('');
  const [images, setImages] = React.useState<
    Array<{ id: string; url: string; title: string; resolution: string }>
  >([]);
  const [selectedImage, setSelectedImage] = React.useState('');
  const [quoteText, setQuoteText] = React.useState('');
  const [captionText, setCaptionText] = React.useState('');
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [scrimOpacity, setScrimOpacity] = React.useState(0.5);
  const [fontFamily, setFontFamily] = React.useState('Playfair Display');
  const aspectRatio = '4/5';
  const [scheduledTime, setScheduledTime] = React.useState('');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [localTimeZone, setLocalTimeZone] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSearchingImages, setIsSearchingImages] = React.useState(false);
  const [isQueuing, setIsQueuing] = React.useState(false);
  const [queueSuccess, setQueueSuccess] = React.useState(false);
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [hybridTheme, setHybridTheme] = React.useState('');
  const [hybridCaption, setHybridCaption] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
    const nextSlot = new Date();
    nextSlot.setHours(nextSlot.getHours() + 1, 0, 0, 0);
    const localNextSlot = new Date(nextSlot.getTime() - nextSlot.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(11, 16);
    setScheduledDate(localToday);
    setScheduledTime(localNextSlot);
    setLocalTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const handleSearchVisuals = async (query = selectedNiche) => {
    if (!query.trim()) {
      setWorkspaceError('Describe the content niche or visual style to search for.');
      return;
    }
    setIsSearchingImages(true);
    setWorkspaceError(null);
    try {
      const res = await fetch(`/api/pinterest?query=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Visual search failed');
      setImages(data.results || []);
      setSelectedImage(data.results?.[0]?.url || '');
      if (!data.results?.length)
        setWorkspaceError('No matching visuals were returned. Try a broader phrase.');
    } catch (error) {
      setImages([]);
      setSelectedImage('');
      setWorkspaceError(error instanceof Error ? error.message : 'Visual search failed');
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleRegenerateQuote = async () => {
    if (!selectedNiche.trim()) {
      setWorkspaceError('Enter a content niche before generating a post.');
      return;
    }
    setIsGenerating(true);
    setWorkspaceError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: selectedNiche }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      setQuoteText(data.quote || '');
      setCaptionText(data.caption || '');
      setHashtags(data.hashtags || []);
      if (data.bg_queries?.[0]) await handleSearchVisuals(data.bg_queries[0]);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedImage) {
      setWorkspaceError('Search for and select an image before adding this post to your queue.');
      return;
    }
    setIsQueuing(true);
    setWorkspaceError(null);
    try {
      const fullCaption = `${quoteText}\n\n${captionText}\n\n${hashtags.join(' ')}`;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: mode === 'auto' ? 'agent' : 'manual',
          media_type: 'IMAGE',
          status: 'pending_approval',
          caption: fullCaption,
          media_paths: [selectedImage],
          scheduled_at:
            scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : null,
          meta: {
            niche: selectedNiche,
            quote: quoteText,
            font: fontFamily,
            scrim: scrimOpacity,
            scheduledTime,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Post could not be added to the queue');
      setQueueSuccess(true);
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#ec4899', '#8b5cf6', '#22c55e'],
      });
      setTimeout(() => setQueueSuccess(false), 4000);
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : 'Post could not be added to the queue',
      );
    } finally {
      setIsQueuing(false);
    }
  };

  const handleGenerateHybridCaption = async () => {
    if (!hybridTheme.trim()) {
      setWorkspaceError('Enter a theme for the caption first.');
      return;
    }
    setWorkspaceError(null);
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: hybridTheme }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Caption generation failed');
      setHybridCaption([data.caption, ...(data.hashtags || [])].filter(Boolean).join('\n\n'));
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : 'Caption generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadAndQueue = async () => {
    if (!uploadFile) {
      setWorkspaceError('Choose an image before adding it to the queue.');
      return;
    }
    setWorkspaceError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', uploadFile);
      const uploadResponse = await fetch('/api/library/upload', { method: 'POST', body: formData });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || 'Image upload failed');

      const scheduledAt =
        scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : null;
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual',
          media_type: 'IMAGE',
          caption: hybridCaption,
          media_paths: [uploadData.asset.url],
          scheduled_at: scheduledAt,
          meta: { title: uploadFile.name, theme: hybridTheme },
        }),
      });
      const postData = await postResponse.json();
      if (!postResponse.ok)
        throw new Error(postData.error || 'Post could not be added to the queue');
      setQueueSuccess(true);
      setUploadFile(null);
      setTimeout(() => setQueueSuccess(false), 4000);
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : 'Post could not be added to the queue',
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Creator Workspace"
        description="Generate original post copy, search live visuals, and save posts to your queue"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Mode Selector Pill */}
        <div className="flex items-center justify-between border-b border-surface-300 pb-5">
          <div className="flex items-center gap-2 bg-surface-100 p-1.5 rounded-xl border border-surface-300">
            <button
              onClick={() => setMode('auto')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'auto'
                  ? 'bg-surface-950 text-surface-0 shadow-sm'
                  : 'text-surface-700 hover:text-surface-950'
              }`}
            >
              <Wand2 className="h-4 w-4 text-accent-400" />
              Automated Studio (Live visuals + AI copy)
            </button>
            <button
              onClick={() => setMode('hybrid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'hybrid'
                  ? 'bg-surface-950 text-surface-0 shadow-sm'
                  : 'text-surface-700 hover:text-surface-950'
              }`}
            >
              <Upload className="h-4 w-4 text-accent-400" />
              Hybrid Studio (Upload & Schedule)
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-surface-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              Saved posts are scoped to your connected Instagram account
            </span>
          </div>
        </div>

        {workspaceError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          >
            <span>{workspaceError}</span>
            <button
              type="button"
              onClick={() => setWorkspaceError(null)}
              aria-label="Dismiss message"
              className="text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {mode === 'auto' ? (
          /* ============================================================ */
          /* FULLY AUTOMATED WORKSPACE ENGINE                             */
          /* ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Flow Controls */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step 1: Niche Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-surface-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/10 text-accent-400 text-xs font-bold">
                      1
                    </span>
                    Select Content Niche
                  </h3>
                  <span className="text-xs text-surface-600">Target audience aesthetic</span>
                </div>

                <Input
                  value={selectedNiche}
                  onChange={(event) => setSelectedNiche(event.target.value)}
                  placeholder="Describe any niche or audience, e.g. sustainable fashion"
                  className="text-sm"
                />
              </div>

              {/* Step 2: live visual search */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-surface-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/10 text-accent-400 text-xs font-bold">
                      2
                    </span>
                    Search live visuals
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearchVisuals()}
                    disabled={isSearchingImages || !selectedNiche.trim()}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isSearchingImages ? 'animate-spin' : ''}`}
                    />
                    {isSearchingImages ? 'Searching…' : 'Search Pexels'}
                  </Button>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {images.map((img) => {
                      const isPicked = selectedImage === img.url;
                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(img.url)}
                          className={`group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                            isPicked
                              ? 'ring-2 ring-accent-500 border-accent-500 shadow-md'
                              : 'border-surface-300 hover:border-surface-400'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-2 flex flex-col justify-between">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-medium bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-zinc-300">
                                {img.resolution}
                              </span>
                              {isPicked && (
                                <div className="h-5 w-5 rounded-full bg-accent-500 text-white flex items-center justify-center shadow">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-200 line-clamp-2 leading-tight">
                              {img.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-surface-400 px-4 py-8 text-center text-xs text-surface-600">
                    {isSearchingImages
                      ? 'Fetching live portrait images…'
                      : 'Search for a style or generate a post to find matching images.'}
                  </div>
                )}
              </div>

              {/* Step 3: Canva-Style Card Customizer */}
              <div className="space-y-4 rounded-2xl border border-surface-300 bg-surface-100/40 p-5">
                <div className="flex items-center justify-between border-b border-surface-300/60 pb-3">
                  <h3 className="text-sm font-semibold text-surface-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/10 text-accent-400 text-xs font-bold">
                      3
                    </span>
                    Studio Canvas Controls
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    Portrait image post
                  </Badge>
                </div>

                {/* Quote Text Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-surface-700">Quote Text</label>
                    <button
                      onClick={handleRegenerateQuote}
                      disabled={isGenerating}
                      className="text-xs text-accent-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      AI Generate New Quote
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    className="w-full rounded-xl border border-surface-400 bg-surface-200/50 p-3 text-sm text-surface-950 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                {/* Typography and Scrim Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-surface-700">Typography Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full h-9 rounded-lg border border-surface-400 bg-surface-200/50 px-3 text-xs text-surface-950 focus:outline-none focus:ring-1 focus:ring-accent-500"
                    >
                      <option value="Playfair Display">
                        Playfair Display (Romantic / Editorial)
                      </option>
                      <option value="Space Grotesk">Space Grotesk (Modern Tech / Stoic)</option>
                      <option value="Inter">Inter (Clean Minimal)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-surface-700">
                      <span>Dark Scrim Opacity</span>
                      <span>{(scrimOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={scrimOpacity}
                      onChange={(e) => setScrimOpacity(parseFloat(e.target.value))}
                      className="w-full accent-accent-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: AI Caption, Hashtags & Audio */}
              <div className="space-y-4 rounded-2xl border border-surface-300 bg-surface-100/40 p-5">
                <div className="flex items-center justify-between border-b border-surface-300/60 pb-3">
                  <h3 className="text-sm font-semibold text-surface-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/10 text-accent-400 text-xs font-bold">
                      4
                    </span>
                    Caption and Hashtags
                  </h3>
                  <Badge variant="default" className="text-[10px]">
                    AI copy
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-surface-700">Instagram Caption</label>
                  <textarea
                    rows={3}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full rounded-xl border border-surface-400 bg-surface-200/50 p-3 text-xs text-surface-950 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                {/* Hashtag chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-surface-700">
                    <span>Viral Hashtags ({hashtags.length} / 30 max)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium bg-surface-200 border border-surface-300 px-2 py-0.5 rounded-md text-surface-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Preview Stage & Publishing Hub */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              <Card3DPreview
                imageUrl={selectedImage}
                quoteText={quoteText}
                fontFamily={fontFamily}
                scrimOpacity={scrimOpacity}
                textColor="#FFFFFF"
                aspectRatio={aspectRatio}
              />

              {/* Schedule Card */}
              <Card className="border-surface-300 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent-400" />
                      Publishing Schedule
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {localTimeZone || 'Local time'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    The selected date and time use your device timezone
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-surface-700">Date</label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(event) => setScheduledDate(event.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-surface-700">Time</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {queueSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl bg-success/10 border border-success/30 p-3 text-xs text-success flex items-center gap-2"
                      >
                        <Check className="h-4 w-4 shrink-0 stroke-[3]" />
                        <span>
                          Post saved for {scheduledDate} at {scheduledTime} (
                          {localTimeZone || 'local time'}).
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    variant="accent"
                    size="lg"
                    onClick={handleSchedulePost}
                    disabled={isQueuing || !selectedImage}
                    className="w-full shadow-lg shadow-accent-500/25 cursor-pointer font-semibold"
                  >
                    {isQueuing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving to your publishing queue...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Approve & Add to Instagram Queue
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* HYBRID UPLOAD STUDIO                                         */
          /* ============================================================ */
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto space-y-6 pt-4"
          >
            <div className="rounded-2xl border-2 border-dashed border-surface-400 bg-surface-100/50 p-8 text-center flex flex-col items-center justify-center space-y-4 hover:border-accent-500/60 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-accent-500/10 flex items-center justify-center text-accent-400">
                <Upload className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-surface-950 font-display">
                  Add an image to your library
                </p>
                <p className="text-xs text-surface-600 max-w-sm">
                  Choose a JPEG, PNG, or WebP image up to 8 MB. It will be saved to your account’s
                  media library.
                </p>
              </div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                className="max-w-sm text-xs"
              />
              {uploadFile && (
                <p className="text-xs text-surface-700">Selected: {uploadFile.name}</p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick AI Captioner</CardTitle>
                <CardDescription>Generate caption copy from the theme you provide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Describe the theme or tone for this caption"
                  value={hybridTheme}
                  onChange={(event) => setHybridTheme(event.target.value)}
                  className="text-xs"
                />
                <Button
                  variant="accent"
                  onClick={handleGenerateHybridCaption}
                  disabled={isGenerating}
                  className="w-full text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {isGenerating ? 'Generating…' : 'Generate caption'}
                </Button>
                <textarea
                  rows={4}
                  value={hybridCaption}
                  onChange={(event) => setHybridCaption(event.target.value)}
                  placeholder="Generated caption and hashtags will appear here"
                  className="w-full rounded-xl border border-surface-400 bg-surface-200/50 p-3 text-xs text-surface-950"
                />
                <Button
                  variant="outline"
                  onClick={handleUploadAndQueue}
                  disabled={isUploading || !uploadFile}
                  className="w-full text-xs"
                >
                  {isUploading ? 'Uploading and saving…' : 'Upload and add to queue'}
                </Button>
                {queueSuccess && (
                  <p className="text-center text-xs font-medium text-success">
                    Image saved and post added to your queue.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
