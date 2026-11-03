import { NextRequest, NextResponse } from 'next/server';

interface NichePreset {
  quote: string;
  author: string;
  caption: string;
  hashtags: string[];
  bg_queries: string[];
}

const PRESETS: Record<string, NichePreset[]> = {
  couple: [
    {
      quote: 'In a room full of art, I would still stare at you.',
      author: 'Unknown',
      caption: 'Some connections don’t need loud declarations. They live in quiet glances, warm coffee cups on rainy mornings, and the comfort of shared silence. ✨',
      hashtags: ['#coupleaesthetic', '#vintagefilm', '#romanticizeyourlife', '#quietmoments', '#cinematiclove', '#moodyfilm', '#35mmlove', '#aestheticfeed'],
      bg_queries: ['couple holding hands film photography 35mm', 'warm sunset embrace silhouette', 'vintage rainy car window reflection'],
    },
    {
      quote: 'We loved with a love that was more than love.',
      author: 'Edgar Allan Poe',
      caption: 'A gentle reminder that genuine warmth is rare and worth holding onto fiercely. Find beauty in the ordinary today.',
      hashtags: ['#romance', '#vintagecouples', '#lovequotes', '#aestheticphotography', '#filmlovers', '#warmtones', '#cinematicvibes'],
      bg_queries: ['lovers walking beach sunset golden hour', 'vintage coffee shop couple conversation', 'warm shadows embracing'],
    },
  ],
  stoic: [
    {
      quote: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
      author: 'Marcus Aurelius',
      caption: 'The world outside will always remain unpredictable. Your tranquility is an internal choice built moment by moment.',
      hashtags: ['#stoicism', '#marcusaurelius', '#mindset', '#innerpeace', '#discipline', '#philosophy', '#stoicquotes', '#ancientwisdom'],
      bg_queries: ['marcus aurelius statue marble chiaroscuro', 'ancient greek architecture pillars dark moody', 'philosopher marble bust dramatic lighting'],
    },
    {
      quote: 'He who fears death will never do anything worthy of a man who is alive.',
      author: 'Seneca',
      caption: 'Fear shrinks potential before failure even has the opportunity. Embrace today with decisive calm.',
      hashtags: ['#seneca', '#stoicmindset', '#mentalstrength', '#stoicphilosophy', '#focus', '#resilience', '#clarity'],
      bg_queries: ['ancient roman sculpture shadows', 'dark moody library antique books', 'marble statue moody aesthetic'],
    },
  ],
  'dark-poetry': [
    {
      quote: 'Silence is not empty. It is full of answers.',
      author: 'Unknown',
      caption: 'Late night ruminations beneath street lamps. Sometimes the heaviest questions resolve only when you stop asking them aloud.',
      hashtags: ['#darkpoetry', '#cinematic', '#melancholy', '#nocturnal', '#deepthoughts', '#existential', '#nightaesthetic'],
      bg_queries: ['rainy city street neon reflection night', 'foggy forest moody road twilight', 'grainy 35mm film lonely street lamp'],
    },
  ],
  anime: [
    {
      quote: 'Even the clouds eventually clear to reveal the same eternal sky.',
      author: 'Makoto Shinkai',
      caption: 'Gazing at twilight skies that feel like painted memories. Breathe, reset, and trust tomorrow.',
      hashtags: ['#animeaesthetic', '#lofi', '#cloudscape', '#nostalgia', '#ghibli', '#sunsetvibes', '#animequote'],
      bg_queries: ['lo-fi anime sky golden hour clouds', 'tokyo neon rainy street dusk', 'anime train window sunset landscape'],
    },
  ],
  luxury: [
    {
      quote: 'Elegance is refusal. The confidence to let simplicity speak.',
      author: 'Coco Chanel',
      caption: 'True refinement never competes for attention. It exists with effortless poise and quiet discernment.',
      hashtags: ['#quietluxury', '#minimalism', '#elegance', '#neutralpalette', '#timeless', '#oldmoney', '#sophisticated'],
      bg_queries: ['minimalist architectural interior concrete shadows', 'vintage classic watch leather moody', 'italian villa courtyard sunlight'],
    },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { niche = 'couple' } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is configured, generate fresh content dynamically
    if (apiKey) {
      try {
        const prompt = `Generate a high-converting Instagram quote card for the "${niche}" niche.
Respond in strict JSON with keys:
- "quote": punchy quote (max 120 chars, no copyright, inspiring)
- "author": author name or "Unknown"
- "caption": aesthetic storytelling caption (150-250 chars)
- "hashtags": array of 15 targeted hashtags
- "bg_queries": array of 3 aesthetic visual search queries for background`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return NextResponse.json({ success: true, ...parsed });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini generation fallback:', geminiErr);
      }
    }

    // High quality aesthetic fallback preset
    const nicheList = PRESETS[niche] || PRESETS.couple;
    const item = nicheList[Math.floor(Math.random() * nicheList.length)];

    return NextResponse.json({
      success: true,
      quote: item.quote,
      author: item.author,
      caption: item.caption,
      hashtags: item.hashtags,
      bg_queries: item.bg_queries,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
