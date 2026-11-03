import * as cheerio from 'cheerio';

export interface BackgroundImageCandidate {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
  aspectRatio: number;
  provider: 'pinterest' | 'curated_fallback';
  credit?: string;
}

export interface PinterestSearchOptions {
  query: string;
  limit?: number;
  minWidth?: number;
  verticalOnly?: boolean;
}

// Curated high-aesthetic backups matching viral niches if Pinterest rate-limits
const CURATED_AESTHETICS: Record<string, BackgroundImageCandidate[]> = {
  couple: [
    {
      id: 'c1',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=85',
      title: 'Warm sunset embrace 35mm film',
      width: 1080,
      height: 1350,
      aspectRatio: 0.8,
      provider: 'curated_fallback',
      credit: 'Unsplash Film Collection',
    },
    {
      id: 'c2',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=85',
      title: 'Holding hands rainy car window reflection',
      width: 1080,
      height: 1920,
      aspectRatio: 0.56,
      provider: 'curated_fallback',
      credit: 'Unsplash Film Collection',
    },
    {
      id: 'c3',
      url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&auto=format&fit=crop&q=85',
      title: 'Golden hour silhouette at beach',
      width: 1080,
      height: 1350,
      aspectRatio: 0.8,
      provider: 'curated_fallback',
      credit: 'Unsplash Film Collection',
    },
    {
      id: 'c4',
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&auto=format&fit=crop&q=85',
      title: 'Vintage coffee shop conversation',
      width: 1080,
      height: 1350,
      aspectRatio: 0.8,
      provider: 'curated_fallback',
      credit: 'Unsplash Film Collection',
    },
  ],
  stoic: [
    {
      id: 's1',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=85',
      title: 'Marcus Aurelius marble bust chiaroscuro',
      width: 1080,
      height: 1350,
      aspectRatio: 0.8,
      provider: 'curated_fallback',
      credit: 'Museum Classical Collection',
    },
    {
      id: 's2',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=85',
      title: 'Dramatic foggy mountain ridge path',
      width: 1080,
      height: 1920,
      aspectRatio: 0.56,
      provider: 'curated_fallback',
      credit: 'Alpine Atmospheric Collection',
    },
  ],
  dark: [
    {
      id: 'd1',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=85',
      title: 'Moody cinematic city street empty fog',
      width: 1080,
      height: 1920,
      aspectRatio: 0.56,
      provider: 'curated_fallback',
      credit: 'Nocturnal Cinema Collection',
    },
    {
      id: 'd2',
      url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1200&auto=format&fit=crop&q=85',
      title: 'Rain drops on dark neon window at night',
      width: 1080,
      height: 1350,
      aspectRatio: 0.8,
      provider: 'curated_fallback',
      credit: 'Nocturnal Cinema Collection',
    },
  ],
};

export class PinterestSearchProvider {
  private proxyApiKey: string | undefined;

  constructor(proxyApiKey?: string) {
    this.proxyApiKey = proxyApiKey || process.env.SCRAPINGBEE_API_KEY;
  }

  /**
   * Search Pinterest for aesthetic images by keyword
   */
  async search(options: PinterestSearchOptions): Promise<BackgroundImageCandidate[]> {
    const { query, limit = 8, minWidth = 700, verticalOnly = true } = options;
    const formattedQuery = encodeURIComponent(query);
    const targetUrl = `https://www.pinterest.com/search/pins/?q=${formattedQuery}`;

    try {
      let html = '';

      if (this.proxyApiKey) {
        // Use ScrapingBee / proxy provider to bypass blocks reliably
        const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${this.proxyApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=false`;
        const res = await fetch(proxyUrl, { headers: { Accept: 'text/html' } });
        if (res.ok) {
          html = await res.text();
        }
      } else {
        // Direct request with browser user-agent
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        });
        if (res.ok) {
          html = await res.text();
        }
      }

      if (html) {
        const candidates = this.extractPinsFromHtml(html, verticalOnly, minWidth);
        if (candidates.length > 0) {
          return candidates.slice(0, limit);
        }
      }
    } catch (err) {
      console.warn(`[PinterestProvider] Search error: ${(err as Error).message}`);
    }

    // High quality fallback based on keyword match
    return this.getFallbackCandidates(query, limit);
  }

  /**
   * Parse high-resolution pins from Pinterest raw HTML
   */
  private extractPinsFromHtml(
    html: string,
    verticalOnly: boolean,
    minWidth: number,
  ): BackgroundImageCandidate[] {
    const $ = cheerio.load(html);
    const candidates: BackgroundImageCandidate[] = [];

    // 1. Try __PWS_DATA__ JSON script tag
    const pwsData = $('#__PWS_DATA__').html();
    if (pwsData) {
      try {
        const parsed = JSON.parse(pwsData);
        const pins = parsed?.props?.initialReduxState?.pins || {};
        for (const [id, pin] of Object.entries<any>(pins)) {
          const orig = pin?.images?.orig;
          if (orig?.url) {
            const w = orig.width || 1080;
            const h = orig.height || 1350;
            const ratio = w / h;

            // Prefer vertical (4:5 or 9:16)
            if (verticalOnly && ratio > 1.05) continue;
            if (w < minWidth && h < minWidth) continue;

            candidates.push({
              id,
              url: orig.url,
              title: pin.title || pin.grid_title || pin.description || 'Pinterest Aesthetic',
              width: w,
              height: h,
              aspectRatio: ratio,
              provider: 'pinterest',
              credit: `Pinterest Pin #${id}`,
            });
          }
        }
      } catch {
        // Fall through to DOM extraction
      }
    }

    // 2. Fallback: Parse img tags directly from feed
    if (candidates.length === 0) {
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('pinimg.com')) {
          // Upgrade thumbnail to original / 736x
          const highResUrl = src
            .replace(/\/\d+x\//, '/originals/')
            .replace(/\/[a-z0-9]+x\//, '/originals/');
          candidates.push({
            id: `pin-${i}`,
            url: highResUrl,
            title: $(el).attr('alt') || 'Pinterest Aesthetic Visual',
            width: 1080,
            height: 1350,
            aspectRatio: 0.8,
            provider: 'pinterest',
          });
        }
      });
    }

    return candidates;
  }

  /**
   * Return high-quality curated visual aesthetic fallback
   */
  private getFallbackCandidates(query: string, limit: number): BackgroundImageCandidate[] {
    const q = query.toLowerCase();
    if (q.includes('couple') || q.includes('love') || q.includes('romance')) {
      return (CURATED_AESTHETICS.couple || []).slice(0, limit);
    }
    if (q.includes('stoic') || q.includes('statue') || q.includes('philosophy')) {
      return (CURATED_AESTHETICS.stoic || []).slice(0, limit);
    }
    return (CURATED_AESTHETICS.dark || []).slice(0, limit);
  }
}

