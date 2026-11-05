import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json(
      { error: 'AI content generation is not configured. Add GEMINI_API_KEY and GEMINI_MODEL.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const niche = typeof body.niche === 'string' ? body.niche.trim() : '';
    if (!niche) return NextResponse.json({ error: 'Enter a content niche first' }, { status: 400 });

    const prompt = `Create original Instagram post copy for this topic or niche: ${JSON.stringify(niche)}.
Return strict JSON with these fields:
- quote: an original short line (maximum 120 characters)
- caption: an original Instagram caption (150 to 250 characters)
- hashtags: an array of 8 to 15 relevant hashtag strings, each beginning with #
- bg_queries: an array of 3 visual-search phrases for portrait photography
Do not attribute quotes to real people. Do not add facts about a real person or account.`;

    const endpoint = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    );
    endpoint.searchParams.set('key', apiKey);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'AI content generation failed' },
        { status: response.status },
      );
    }

    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof generatedText !== 'string') {
      return NextResponse.json(
        { error: 'AI did not return content. Please try again.' },
        { status: 502 },
      );
    }
    const generated: unknown = JSON.parse(generatedText);
    if (
      typeof generated !== 'object' ||
      generated === null ||
      !('quote' in generated) ||
      typeof generated.quote !== 'string' ||
      !('caption' in generated) ||
      typeof generated.caption !== 'string' ||
      !('hashtags' in generated) ||
      !Array.isArray(generated.hashtags) ||
      !('bg_queries' in generated) ||
      !Array.isArray(generated.bg_queries)
    ) {
      return NextResponse.json(
        { error: 'AI returned content in an unexpected format' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      quote: generated.quote,
      caption: generated.caption,
      hashtags: generated.hashtags
        .filter((tag): tag is string => typeof tag === 'string')
        .slice(0, 30),
      bg_queries: generated.bg_queries
        .filter((query): query is string => typeof query === 'string')
        .slice(0, 3),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not generate content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
