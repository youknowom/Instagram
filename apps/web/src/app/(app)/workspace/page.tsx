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
  ChevronRight,
  Music,
  Calendar,
  Clock,
  Sliders,
  Type,
  Layers,
  Share2,
  RefreshCw,
  Copy,
  Info,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card3DPreview } from '@/components/studio/Card3DPreview';
import { fadeUp, springGentle, springBounce } from '@/lib/motion';

const NICHES = [
  { id: 'couple', name: 'Couple & Romance', icon: '❤️', hint: 'Moody vintage 90s film aesthetic' },
  {
    id: 'stoic',
    name: 'Stoic Wisdom',
    icon: '🏛️',
    hint: 'Sculptures, ancient architecture, philosophy',
  },
  {
    id: 'dark-poetry',
    name: 'Dark Poetry & Cinema',
    icon: '🌙',
    hint: 'Grainy film stills, rain, melancholic night',
  },
  {
    id: 'anime',
    name: 'Anime Aesthetics',
    icon: '⚡',
    hint: 'Lo-fi anime skies, neon streets, warm dusk',
  },
  {
    id: 'luxury',
    name: 'Quiet Luxury',
    icon: '🍸',
    hint: 'Minimalist architecture, old money vintage',
  },
];

const MOCK_PINTEREST_RESULTS: Record<
  string,
  Array<{ id: string; url: string; title: string; resolution: string }>
> = {
  couple: [
    {
      id: 'c1',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=85',
      title: 'Warm sunset embrace 35mm film',
      resolution: '1080x1350',
    },
    {
      id: 'c2',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=85',
      title: 'Holding hands rainy car window reflection',
      resolution: '1080x1920',
    },
    {
      id: 'c3',
      url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&auto=format&fit=crop&q=85',
      title: 'Golden hour silhouette at beach',
      resolution: '1080x1350',
    },
    {
      id: 'c4',
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=85',
      title: 'Vintage coffee shop conversation',
      resolution: '1080x1350',
    },
  ],
  stoic: [
    {
      id: 's1',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=85',
      title: 'Marcus Aurelius marble bust warm chiaroscuro',
      resolution: '1080x1350',
    },
    {
      id: 's2',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=85',
      title: 'Dramatic foggy mountain ridge path',
      resolution: '1080x1920',
    },
  ],
  'dark-poetry': [
    {
      id: 'p1',
      url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=85',
      title: 'Rain drops on dark neon window at night',
      resolution: '1080x1350',
    },
    {
      id: 'p2',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=85',
      title: 'Moody cinematic city street empty fog',
      resolution: '1080x1920',
    },
  ],
  anime: [
    {
      id: 'a1',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=85',
      title: 'Pastel purple twilight cloudscape',
      resolution: '1080x1350',
    },
  ],
  luxury: [
    {
      id: 'l1',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=85',
      title: 'Modern architectural villa overlooking water',
      resolution: '1080x1350',
    },
  ],
};

const QUOTE_PRESETS: Record<string, { quote: string; caption: string; hashtags: string[] }> = {
  couple: {
    quote: 'In a room full of art, I would still stare at you.',
    caption:
      'Some connections don’t need words — they just exist in quiet glances and comfortable silences. Tag the one person who feels like home. ✨',
    hashtags: ['#couplelove', '#romancequotes', '#aestheticvibes', '#lovequotes', '#heartfelt'],
  },
  stoic: {
    quote:
      'You have power over your mind, not outside events. Realize this, and you will find strength.',
    caption:
      'Mastering the art of indifference toward what you cannot control. Peace begins where expectation ends.',
    hashtags: ['#stoicism', '#marcusaurelius', '#innerstrength', '#mindsetshift', '#stoicwisdom'],
  },
  'dark-poetry': {
    quote: 'Silence is not empty. It is full of answers you are not ready to hear.',
    caption:
      'Late night ruminations. Sometimes the loudest conversations happen in complete stillness.',
    hashtags: ['#darkpoetry', '#melancholy', '#cinematicvibes', '#midnightthoughts', '#poetryporn'],
  },
  anime: {
    quote: 'Even if the skies turn dark, memories keep their neon glow.',
    caption:
      'Nostalgic dusk in Tokyo. Remember where you started before you stress about where you are going.',
    hashtags: ['#animeaesthetic', '#lofihiphop', '#citypop', '#neonaesthetic', '#dusk'],
  },
  luxury: {
    quote: 'Silence is the ultimate luxury. Let your results speak.',
    caption:
      'Curate your energy, your circle, and your time. Quality over noise every single time.',
    hashtags: ['#quietluxury', '#oldmoney', '#minimalism', '#highstandards', '#discipline'],
  },
};

export default function WorkspacePage() {
  const [mode, setMode] = React.useState<'auto' | 'hybrid'>('auto');
  const [selectedNiche, setSelectedNiche] = React.useState('couple');
  const [images, setImages] = React.useState<Array<{ id: string; url: string; title: string; resolution: string }>>(
    MOCK_PINTEREST_RESULTS.couple
  );
  const [selectedImage, setSelectedImage] = React.useState(MOCK_PINTEREST_RESULTS.couple[0].url);
  const [quoteText, setQuoteText] = React.useState(QUOTE_PRESETS.couple.quote);
  const [captionText, setCaptionText] = React.useState(QUOTE_PRESETS.couple.caption);
  const [hashtags, setHashtags] = React.useState<string[]>(QUOTE_PRESETS.couple.hashtags);
  const [scrimOpacity, setScrimOpacity] = React.useState(0.5);
  const [fontFamily, setFontFamily] = React.useState('Playfair Display');
  const [aspectRatio, setAspectRatio] = React.useState<'4/5' | '9/16'>('4/5');
  const [isAiDisclosed, setIsAiDisclosed] = React.useState(false);
  const [audioOption, setAudioOption] = React.useState<'trending_ig' | 'baked_lofi' | 'none'>(
    'trending_ig',
  );
  const [scheduledTime, setScheduledTime] = React.useState('19:30');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isQueuing, setIsQueuing] = React.useState(false);
  const [queueSuccess, setQueueSuccess] = React.useState(false);

  // Sync niche preset & live visual backgrounds
  const handleNicheChange = async (nicheId: string) => {
    setSelectedNiche(nicheId);
    try {
      const res = await fetch(`/api/pinterest?niche=${nicheId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setImages(data.results);
          setSelectedImage(data.results[0].url);
        }
      }
    } catch {
      const fallback = MOCK_PINTEREST_RESULTS[nicheId] || MOCK_PINTEREST_RESULTS.couple;
      setImages(fallback);
      setSelectedImage(fallback[0].url);
    }

    const preset = QUOTE_PRESETS[nicheId] || QUOTE_PRESETS.couple;
    setQuoteText(preset.quote);
    setCaptionText(preset.caption);
    setHashtags(preset.hashtags);
  };

  const handleRegenerateQuote = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: selectedNiche }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quote) setQuoteText(data.quote);
        if (data.caption) setCaptionText(data.caption);
        if (data.hashtags && data.hashtags.length > 0) setHashtags(data.hashtags);
      }
    } catch {
      const quotes = [
        'We loved with a love that was more than love.',
        'You are my favorite notification in a noisy world.',
        'Home is not a place, it is a person with your eyes.',
      ];
      setQuoteText(quotes[Math.floor(Math.random() * quotes.length)]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedulePost = async () => {
    setIsQueuing(true);
    try {
      const fullCaption = `${quoteText}\n\n${captionText}\n\n${hashtags.join(' ')}`;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: mode === 'auto' ? 'agent' : 'manual',
          media_type: aspectRatio === '9/16' ? 'REELS' : 'IMAGE',
          status: 'pending_approval',
          caption: fullCaption,
          media_paths: [selectedImage],
          meta: {
            niche: selectedNiche,
            quote: quoteText,
            font: fontFamily,
            scrim: scrimOpacity,
            scheduledTime,
          },
        }),
      });

      if (res.ok) {
        setQueueSuccess(true);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#ec4899', '#8b5cf6', '#22c55e'],
        });
        setTimeout(() => setQueueSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to queue post:', err);
    } finally {
      setIsQueuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-20">
      <Header
        title="Creator Workspace"
        description="Design quote cards, discover Pinterest aesthetics, and publish on autopilot"
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
              Automated Agent (Pinterest + AI)
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
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Instagram API v26.0 (Dry-Run Guard ON)
            </span>
          </div>
        </div>

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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {NICHES.map((niche) => {
                    const isSelected = selectedNiche === niche.id;
                    return (
                      <button
                        key={niche.id}
                        onClick={() => handleNicheChange(niche.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-accent-500 bg-accent-500/5 ring-1 ring-accent-500'
                            : 'border-surface-300 bg-surface-100/60 hover:border-surface-400'
                        }`}
                      >
                        <div className="text-lg mb-1">{niche.icon}</div>
                        <p className="text-xs font-semibold text-surface-950 line-clamp-1">
                          {niche.name}
                        </p>
                        <p className="text-[10px] text-surface-600 line-clamp-1 mt-0.5">
                          {niche.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Pinterest Visual Discovery Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-surface-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/10 text-accent-400 text-xs font-bold">
                      2
                    </span>
                    Pinterest Aesthetic Discovery
                  </h3>
                  <Badge variant="accent" className="text-[10px] uppercase font-semibold">
                    Live Scraper
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    },
                  )}
                </div>
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
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setAspectRatio('4/5')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        aspectRatio === '4/5'
                          ? 'bg-surface-300 font-semibold text-surface-950'
                          : 'text-surface-700'
                      }`}
                    >
                      4:5 (Post)
                    </button>
                    <button
                      onClick={() => setAspectRatio('9/16')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        aspectRatio === '9/16'
                          ? 'bg-surface-300 font-semibold text-surface-950'
                          : 'text-surface-700'
                      }`}
                    >
                      9:16 (Reel)
                    </button>
                  </div>
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
                    Caption, Hashtags & Music
                  </h3>
                  <Badge variant="default" className="text-[10px]">
                    Gemini 2.0
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

                {/* Music & Audio */}
                <div className="pt-2 border-t border-surface-300/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-accent-400" />
                    <span className="text-xs font-medium text-surface-950">
                      Audio Configuration:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setAudioOption('trending_ig')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        audioOption === 'trending_ig'
                          ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                          : 'border-surface-400 text-surface-700'
                      }`}
                    >
                      Trending Reel Sound (Meta Audio API)
                    </button>
                    <button
                      onClick={() => setAudioOption('none')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        audioOption === 'none'
                          ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                          : 'border-surface-400 text-surface-700'
                      }`}
                    >
                      Image Post (No Audio)
                    </button>
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
                      Asia/Kolkata
                    </Badge>
                  </CardTitle>
                  <CardDescription>Scheduled slot for highest engagement</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-surface-700">Date</label>
                      <Input type="date" defaultValue="2026-11-02" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-surface-700">Time (IST)</label>
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
                        className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4 shrink-0 stroke-[3]" />
                        <span>Successfully added to publishing queue for {scheduledTime} IST!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    variant="accent"
                    size="lg"
                    onClick={handleSchedulePost}
                    disabled={isQueuing}
                    className="w-full shadow-lg shadow-accent-500/25 cursor-pointer font-semibold"
                  >
                    {isQueuing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Container & Scheduling...
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
            <div className="rounded-2xl border-2 border-dashed border-surface-400 bg-surface-100/50 p-12 text-center flex flex-col items-center justify-center space-y-4 hover:border-accent-500/60 transition-colors cursor-pointer">
              <div className="h-14 w-14 rounded-2xl bg-accent-500/10 flex items-center justify-center text-accent-400">
                <Upload className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-surface-950 font-display">
                  Drop your Reel (MP4) or High-Res Image here
                </p>
                <p className="text-xs text-surface-600 max-w-sm">
                  Supports MP4, MOV (up to 300MB) and JPEG (up to 8MB). Recommended 9:16 vertical or
                  4:5 portrait.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Browse Files
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick AI Captioner</CardTitle>
                <CardDescription>
                  AI will inspect your uploaded file and generate viral hooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Optional: Tell AI the theme or tone (e.g. 'late night gym motivation')"
                  className="text-xs"
                />
                <Button variant="accent" className="w-full text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generate Caption & Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
