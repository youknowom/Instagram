import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: kvData } = await supabase
      .from('kv')
      .select('value')
      .eq('key', 'ig_access_token')
      .maybeSingle();

    if (kvData?.value) {
      const tokenInfo = kvData.value as {
        token?: string;
        user_id?: string;
        username?: string;
        expires_at?: string;
      };

      const expiresAt = tokenInfo.expires_at ? new Date(tokenInfo.expires_at) : null;
      const now = new Date();
      const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      return NextResponse.json({
        connected: Boolean(tokenInfo.token),
        userId: tokenInfo.user_id || null,
        username: tokenInfo.username ? `@${tokenInfo.username.replace(/^@/, '')}` : null,
        daysRemaining,
        expiresAt: tokenInfo.expires_at || null,
      });
    }

    // Check environment fallback
    const envUserId = process.env.IG_USER_ID;
    const hasInitialToken = Boolean(process.env.IG_INITIAL_TOKEN);

    if (hasInitialToken && envUserId) {
      return NextResponse.json({
        connected: true,
        userId: envUserId,
        username: '@configured_creator',
        daysRemaining: 60,
        expiresAt: null,
      });
    }

    return NextResponse.json({
      connected: false,
      userId: null,
      username: null,
      daysRemaining: null,
      expiresAt: null,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      userId: null,
      username: null,
      daysRemaining: null,
      expiresAt: null,
    });
  }
}
