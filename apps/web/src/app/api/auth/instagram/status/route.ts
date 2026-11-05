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
          connected: false,
          userId: null,
          username: null,
          name: null,
          profilePictureUrl: null,
          daysRemaining: null,
          expiresAt: null,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const supabase = getSupabaseAdmin();
    const tokenInfo = await getInstagramTokenInfo(supabase, accountId);
    if (!tokenInfo?.token || tokenInfo.user_id !== accountId) {
      return NextResponse.json(
        {
          connected: false,
          userId: null,
          username: null,
          name: null,
          profilePictureUrl: null,
          daysRemaining: null,
          expiresAt: null,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    let profile = {
      username: tokenInfo.username || null,
      name: tokenInfo.name || null,
      accountType: tokenInfo.account_type || null,
      profilePictureUrl: tokenInfo.profile_picture_url || null,
    };

    const profileUrl = new URL(getInstagramGraphUrl(getInstagramProfilePath(accountId)));
    profileUrl.searchParams.set('fields', getInstagramProfileFields());
    profileUrl.searchParams.set('access_token', tokenInfo.token);
    try {
      const profileResponse = await fetch(profileUrl, { cache: 'no-store' });
      const liveProfile = await profileResponse.json();
      if (profileResponse.ok) {
        profile = {
          username: liveProfile.username || profile.username,
          name: liveProfile.name || profile.name,
          accountType: liveProfile.account_type || profile.accountType,
          profilePictureUrl: liveProfile.profile_picture_url || profile.profilePictureUrl,
        };
        await supabase
          .from('kv')
          .update({
            value: {
              ...tokenInfo,
              username: profile.username,
              name: profile.name,
              account_type: profile.accountType,
              profile_picture_url: profile.profilePictureUrl,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('key', `ig_access_token:${accountId}`);
      }
    } catch {
      // Keep the persisted profile visible while Instagram's API is unreachable.
    }

    const expiresAt = tokenInfo.expires_at ? new Date(tokenInfo.expires_at) : null;
    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
    const tokenExpired = expiresAt !== null && expiresAt.getTime() <= Date.now();

    return NextResponse.json(
      {
        connected: !tokenExpired,
        userId: accountId,
        username: profile.username ? `@${profile.username.replace(/^@/, '')}` : null,
        name: profile.name,
        accountType: profile.accountType,
        profilePictureUrl: profile.profilePictureUrl,
        daysRemaining,
        expiresAt: tokenInfo.expires_at || null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read Instagram connection';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
