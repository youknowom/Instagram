import { NextRequest, NextResponse } from 'next/server';

interface VisualCandidate {
  id: string;
  url: string;
  title: string;
  resolution: string;
}

const CURATED_CANDIDATES: Record<string, VisualCandidate[]> = {
  couple: [
    {
      id: 'c1',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1080&auto=format&fit=crop&q=85',
      title: 'Warm sunset embrace 35mm film grain',
      resolution: '1080x1350',
    },
    {
      id: 'c2',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1080&auto=format&fit=crop&q=85',
      title: 'Holding hands rainy car window reflection',
      resolution: '1080x1920',
    },
    {
      id: 'c3',
      url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1080&auto=format&fit=crop&q=85',
      title: 'Golden hour lovers silhouette at beach',
      resolution: '1080x1350',
    },
    {
      id: 'c4',
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1080&auto=format&fit=crop&q=85',
      title: 'Vintage coffee shop conversation 90s mood',
      resolution: '1080x1350',
    },
  ],
  stoic: [
    {
      id: 's1',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1080&auto=format&fit=crop&q=85',
      title: 'Marcus Aurelius marble bust warm chiaroscuro',
      resolution: '1080x1350',
    },
    {
      id: 's2',
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1080&auto=format&fit=crop&q=85',
      title: 'Ancient Greek temple pillars dramatic moody shadows',
      resolution: '1080x1920',
    },
    {
      id: 's3',
      url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1080&auto=format&fit=crop&q=85',
      title: 'Dark stone sculpture museum lighting',
      resolution: '1080x1350',
    },
  ],
  'dark-poetry': [
    {
      id: 'dp1',
      url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1080&auto=format&fit=crop&q=85',
      title: 'Rainy asphalt night reflections neon',
      resolution: '1080x1350',
    },
    {
      id: 'dp2',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=85',
      title: 'Misty pine forest lonely foggy path',
      resolution: '1080x1920',
    },
  ],
  anime: [
    {
      id: 'a1',
      url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&auto=format&fit=crop&q=85',
      title: 'Golden sunset over stylized clouds aesthetic',
      resolution: '1080x1350',
    },
    {
      id: 'a2',
      url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1080&auto=format&fit=crop&q=85',
      title: 'Vibrant dusk sky purple clouds',
      resolution: '1080x1920',
    },
  ],
  luxury: [
    {
      id: 'l1',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&auto=format&fit=crop&q=85',
      title: 'Minimalist modern concrete architecture with sunlight',
      resolution: '1080x1350',
    },
    {
      id: 'l2',
      url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1080&auto=format&fit=crop&q=85',
      title: 'Vintage neutral interior aesthetic shadows',
      resolution: '1080x1350',
    },
  ],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const niche = searchParams.get('niche') || 'couple';

  const candidates = CURATED_CANDIDATES[niche] || CURATED_CANDIDATES.couple;

  return NextResponse.json({
    success: true,
    results: candidates,
  });
}
