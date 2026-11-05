import { NextRequest, NextResponse } from 'next/server';

interface PexelsPhoto {
  id: number;
  alt: string;
  width: number;
  height: number;
  src: { large: string; portrait: string };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim();
  const apiKey = process.env.PEXELS_API_KEY;

  if (!query)
    return NextResponse.json(
      { error: 'Enter a visual search phrase', results: [] },
      { status: 400 },
    );
  if (!apiKey)
    return NextResponse.json(
      { error: 'Visual search is not configured. Add PEXELS_API_KEY.' },
      { status: 503 },
    );

  try {
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', 'portrait');
    url.searchParams.set('per_page', '12');
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || 'Visual search could not reach Pexels', results: [] },
        { status: response.status },
      );
    }

    const results = ((data.photos || []) as PexelsPhoto[]).map((photo) => ({
      id: String(photo.id),
      url: photo.src.portrait || photo.src.large,
      title: photo.alt || query,
      resolution: `${photo.width}×${photo.height}`,
    }));
    return NextResponse.json(
      { success: true, results },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Visual search failed';
    return NextResponse.json({ error: message, results: [] }, { status: 502 });
  }
}
