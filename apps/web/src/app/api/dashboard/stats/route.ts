import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  getInstagramAccountId,
  getInstagramGraphUrl,
  getInstagramProfileFields,
  getInstagramProfilePath,
  getInstagramTokenInfo,
} from '@/lib/instagram';

export async function GET(request: NextRequest) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId) {
      return NextResponse.json(
        {
          success: true,
          connected: false,
          profile: null,
          stats: { totalPosts: 0, queuedPosts: 0, publishedPosts: 0 },
          recentPosts: [],
          snapshots: [],
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const supabase = getSupabaseAdmin();
    const [tokenInfo, postResult] = await Promise.all([
      getInstagramTokenInfo(supabase, accountId),
      supabase
        .from('posts')
        .select('*')
        .eq('instagram_user_id', accountId)
        .order('created_at', { ascending: false }),
    ]);
    if (postResult.error) throw new Error(postResult.error.message);

    let profile: Record<string, unknown> | null = null;
    let snapshots: Array<Record<string, unknown>> = [];
    if (tokenInfo?.token && tokenInfo.user_id === accountId) {
      const profileUrl = new URL(getInstagramGraphUrl(getInstagramProfilePath(accountId)));
      profileUrl.searchParams.set('fields', getInstagramProfileFields());
      profileUrl.searchParams.set('access_token', tokenInfo.token);
      let profileResponse: Response | null = null;
      let liveProfile: Record<string, unknown> & { error?: { message?: string } } = {};
      try {
        profileResponse = await fetch(profileUrl, { cache: 'no-store' });
        liveProfile = await profileResponse.json();
      } catch (error) {
        liveProfile.error = {
          message: error instanceof Error ? error.message : 'Instagram is temporarily unreachable',
        };
      }

      if (!profileResponse?.ok) {
        profile = {
          userId: accountId,
          username: tokenInfo.username || null,
          name: tokenInfo.name || null,
          profilePictureUrl: tokenInfo.profile_picture_url || null,
          connected: true,
          error: liveProfile?.error?.message || 'Instagram metrics are temporarily unavailable',
        };
      } else {
        profile = {
          userId: accountId,
          username: liveProfile.username || tokenInfo.username || null,
          name: liveProfile.name || tokenInfo.name || null,
          profilePictureUrl:
            liveProfile.profile_picture_url || tokenInfo.profile_picture_url || null,
          followers: liveProfile.followers_count ?? null,
          following: liveProfile.follows_count ?? null,
          mediaCount: liveProfile.media_count ?? null,
          connected: true,
        };

        await supabase
          .from('kv')
          .update({
            value: {
              ...tokenInfo,
              username: liveProfile.username || tokenInfo.username,
              name: liveProfile.name || tokenInfo.name,
              profile_picture_url: liveProfile.profile_picture_url || tokenInfo.profile_picture_url,
              updated_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('key', `ig_access_token:${accountId}`);

        const now = new Date();
        const dayKey = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        await supabase.from('account_snapshots').upsert(
          {
            instagram_user_id: accountId,
            taken_at: dayKey.toISOString(),
            followers: liveProfile.followers_count ?? null,
            following: liveProfile.follows_count ?? null,
            media_count: liveProfile.media_count ?? null,
            raw: { instagram_user_id: accountId },
          },
          { onConflict: 'instagram_user_id,taken_at' },
        );
      }

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const snapshotResult = await supabase
        .from('account_snapshots')
        .select('taken_at,followers,following,media_count')
        .eq('instagram_user_id', accountId)
        .gte('taken_at', since)
        .order('taken_at', { ascending: true });
      snapshots = snapshotResult.data || [];
    }

    const allPosts = postResult.data || [];
    return NextResponse.json(
      {
        success: true,
        connected: Boolean(tokenInfo?.token && profile?.connected),
        profile,
        stats: {
          totalPosts: allPosts.length,
          queuedPosts: allPosts.filter((post) =>
            ['pending_approval', 'approved'].includes(post.status),
          ).length,
          publishedPosts: allPosts.filter((post) => post.status === 'posted').length,
        },
        recentPosts: allPosts.slice(0, 6),
        snapshots,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load dashboard data';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
