import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { CAPTION_MAX_LENGTH, HASHTAG_DEFAULT_COUNT } from '@ig-auto/core';

export const AgentIdeaOutputSchema = z.object({
  quote: z.string().min(5).max(140),
  caption: z.string().min(10).max(CAPTION_MAX_LENGTH),
  hashtags: z.array(z.string()).min(3).max(HASHTAG_DEFAULT_COUNT),
  alt_text: z.string().min(5).max(300),
  bg_queries: z.array(z.string()).min(3).max(6),
  style_preset_id: z.string().default('vintage_film'),
});

export type AgentIdeaOutput = z.infer<typeof AgentIdeaOutputSchema>;

export interface GenerateIdeaOptions {
  nicheName: string;
  nicheRules?: {
    tone?: string;
    bannedTopics?: string[];
  };
  previousQuotes?: string[];
  geminiApiKey?: string;
  geminiModel?: string;
}

export class QuoteAgent {
  private ai: GoogleGenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  /**
   * Generates a viral quote, caption, hashtags, and Pinterest background queries
   */
  async generateIdea(options: GenerateIdeaOptions): Promise<AgentIdeaOutput> {
    const { nicheName, nicheRules, previousQuotes = [] } = options;

    if (!this.ai) {
      // Offline fallback generator
      return this.generateOfflineFallback(nicheName);
    }

    const systemPrompt = `You are a viral social media strategist and quote curator specializing in high-engagement Instagram theme pages.
Your job is to generate original, evocative, highly saveable and shareable quote cards.

NICHE: ${nicheName}
TONE: ${nicheRules?.tone || 'evocative, aesthetic, thoughtful, 90s cinema vibe'}
BANNED TOPICS: ${(nicheRules?.bannedTopics || ['explicit content', 'hate speech', 'medical advice']).join(', ')}

PREVIOUS RECENT QUOTES (DO NOT REPEAT):
${
  previousQuotes
    .slice(0, 20)
    .map((q) => `- "${q}"`)
    .join('\n') || 'None'
}

STRICT PRODUCT RULES:
1. "quote" MUST be under 140 characters. Punchy, poetic, emotionally resonant.
2. DO NOT include any @mentions anywhere (never tag real people or accounts).
3. "caption" should be thoughtful, 2-3 sentences max, ending with an engaging question or invitation to save.
4. "hashtags" must be lowercase with '#' prefix, exactly 15 to 20 relevant tags.
5. "bg_queries" must contain 3-5 specific Pinterest search phrases that will yield aesthetic, moody, high-res vertical images for this quote.
6. Return purely valid JSON matching the schema.`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Generate an original Instagram post idea for the niche: "${nicheName}".` },
            ],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const rawText = response.text || '';
      const parsedJson = JSON.parse(rawText);

      // Sanitize mentions from output
      const sanitized = {
        ...parsedJson,
        quote: (parsedJson.quote || '').replace(/@\w+/g, '').trim(),
        caption: (parsedJson.caption || '').replace(/@\w+/g, '').trim(),
        hashtags: (parsedJson.hashtags || []).map((t: string) =>
          t.startsWith('#') ? t.toLowerCase() : `#${t.toLowerCase()}`,
        ),
      };

      return AgentIdeaOutputSchema.parse(sanitized);
    } catch (err) {
      console.warn(`[QuoteAgent] LLM generation error, using fallback: ${(err as Error).message}`);
      return this.generateOfflineFallback(nicheName);
    }
  }

  /**
   * Safe offline presets when API key is unconfigured or testing
   */
  private generateOfflineFallback(nicheName: string): AgentIdeaOutput {
    const q = nicheName.toLowerCase();
    if (q.includes('couple') || q.includes('romance') || q.includes('love')) {
      return {
        quote: 'In a room full of art, I would still stare at you.',
        caption:
          'Some connections do not need words. They exist in quiet glances and comfortable silences. ✨ Tag someone who feels like home.',
        hashtags: [
          '#couplelove',
          '#romancequotes',
          '#aestheticvibes',
          '#lovequotes',
          '#heartfelt',
          '#vintageromance',
          '#softlove',
          '#35mmfilm',
          '#lovers',
        ],
        alt_text: 'Romantic couple in warm 35mm film light with aesthetic typography quote card',
        bg_queries: [
          'couple vintage 35mm film',
          'warm sunset couple embrace',
          'holding hands rainy window aesthetic',
        ],
        style_preset_id: 'vintage_film',
      };
    }

    if (q.includes('stoic') || q.includes('wisdom') || q.includes('mindset')) {
      return {
        quote:
          'You have power over your mind, not outside events. Realize this, and you will find strength.',
        caption:
          'Mastering the art of indifference toward what is out of your control. Inner peace begins where external expectations end. 🏛️',
        hashtags: [
          '#stoicism',
          '#marcusaurelius',
          '#innerpeace',
          '#discipline',
          '#stoicmindset',
          '#ancientwisdom',
          '#philosophy',
          '#clarity',
        ],
        alt_text: 'Marcus Aurelius marble bust with stoic quote typography overlay',
        bg_queries: [
          'marcus aurelius statue dark chiaroscuro',
          'foggy mountain ridge path',
          'ancient greek architecture aesthetic',
        ],
        style_preset_id: 'stoic_monochrome',
      };
    }

    return {
      quote: 'Silence is not empty. It is full of answers you are not ready to hear.',
      caption:
        'Late night reflections. Sometimes the loudest revelations come when everything else is quiet. 🌙',
      hashtags: [
        '#darkpoetry',
        '#midnightthoughts',
        '#cinematicvibes',
        '#aestheticquotes',
        '#solitude',
        '#nocturnal',
        '#deepthoughts',
      ],
      alt_text: 'Cinematic rainy city street at night with dark typography quote overlay',
      bg_queries: [
        'rain drops on dark neon window',
        'moody empty cinematic street night',
        'grainy 90s film night aesthetic',
      ],
      style_preset_id: 'dark_poetry',
    };
  }
}
