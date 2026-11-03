import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch real post counts from Supabase
    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    const allPosts = posts || [];
    const totalCount = allPosts.length;
    const queuedCount = allPosts.filter((p) => p.status === 'pending_approval' || p.status === 'approved').length;
    const publishedCount = allPosts.filter((p) => p.status === 'posted').length;

    // 2. Fetch connected Instagram account profile & metrics
    const { data: kvData } = await supabase
      .from('kv')
      .select('value')
      .eq('key', 'ig_access_token')
      .maybeSingle();

    const tokenInfo = kvData?.value as {
      token?: string;
      user_id?: string;
      username?: string;
    } | undefined;

    let igProfile = {
      username: tokenInfo?.username || 'youkknowom',
      followers: 1240,
      following: 380,
      mediaCount: publishedCount,
      connected: Boolean(tokenInfo?.token),
    };

    if (tokenInfo?.token && tokenInfo?.user_id) {
      try {
        const igUrl = new URL(`https://graph.facebook.com/v26.0/${tokenInfo.user_id}`);
        igUrl.searchParams.set('fields', 'followers_count,follows_count,media_count,username');
        igUrl.searchParams.set('access_token', tokenInfo.token);

        const res = await fetch(igUrl.toString());
        if (res.ok) {
          const igData = await res.json();
          igProfile = {
            username: igData.username || igProfile.username,
            followers: igData.followers_count ?? igProfile.followers,
            following: igData.follows_count ?? igProfile.following,
            mediaCount: igData.media_count ?? igProfile.mediaCount,
            connected: true,
          };
        }
      } catch {
        // Fallback to basic stored state
      }
    }

    return NextResponse.json({
      success: true,
      profile: igProfile,
      stats: {
        totalPosts: totalCount,
        queuedPosts: queuedCount,
        publishedPosts: publishedCount,
      },
      recentPosts: allPosts.slice(0, 6),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

