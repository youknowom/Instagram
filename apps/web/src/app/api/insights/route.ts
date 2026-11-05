import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  getInstagramAccountId,
  getInstagramGraphUrl,
  getInstagramMediaPath,
  getInstagramTokenInfo,
} from '@/lib/instagram';

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  media_url?: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
}

export async function GET(request: NextRequest) {
  const accountId = getInstagramAccountId(request);
  if (!accountId)
    return NextResponse.json(
      { error: 'Connect an Instagram account first', media: [] },
      { status: 401 },
    );

  try {
    const supabase = getSupabaseAdmin();
    const tokenInfo = await getInstagramTokenInfo(supabase, accountId);
    if (!tokenInfo?.token || tokenInfo.user_id !== accountId) {
      return NextResponse.json(
        { error: 'Instagram connection has expired. Reconnect in Settings.', media: [] },
        { status: 401 },
      );
    }

    const mediaUrl = new URL(getInstagramGraphUrl(getInstagramMediaPath(accountId)));
    mediaUrl.searchParams.set(
      'fields',
      'id,caption,media_type,permalink,timestamp,media_url,thumbnail_url,like_count,comments_count',
    );
    mediaUrl.searchParams.set('limit', '25');
    mediaUrl.searchParams.set('access_token', tokenInfo.token);
    const response = await fetch(mediaUrl, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || 'Instagram insights are unavailable for this account',
          media: [],
        },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const media = ((data.data || []) as InstagramMedia[]).map((post) => ({
      id: post.id,
      caption: post.caption || '',
      mediaType: post.media_type || 'IMAGE',
      permalink: post.permalink || null,
      timestamp: post.timestamp || null,
      mediaUrl: post.media_url || post.thumbnail_url || null,
      likes: post.like_count ?? null,
      comments: post.comments_count ?? null,
    }));
    const measured = media.filter((post) => post.likes !== null && post.comments !== null);
    return NextResponse.json(
      {
        media,
        summary: {
          posts: media.length,
          likes: measured.reduce((sum, post) => sum + (post.likes || 0), 0),
          comments: measured.reduce((sum, post) => sum + (post.comments || 0), 0),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch Instagram insights';
    return NextResponse.json({ error: message, media: [] }, { status: 500 });
  }
}
