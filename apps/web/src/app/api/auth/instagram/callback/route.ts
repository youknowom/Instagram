import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle user declining or Instagram errors
  if (error) {
    const message = errorDescription || error || 'Authorization was cancelled';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/settings?error=No+code+received+from+Instagram`);
  }

  // Verify CSRF state token
  const savedState = request.cookies.get('ig_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent('Security check failed: state parameter mismatch')}`
    );
  }

  const appId = process.env.IG_APP_ID;
  const appSecret = process.env.IG_APP_SECRET;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent('Server misconfiguration: missing App ID or Secret')}`
    );
  }

  try {
    // ──────────────────────────────────────────────
    // Step 1: Exchange code for short-lived token
    // Instagram Login uses api.instagram.com (NOT graph.facebook.com)
    // ──────────────────────────────────────────────
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      const err = tokenData?.error_message || tokenData?.error?.message || 'Failed to exchange authorization code';
      return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(err)}`);
    }

    const shortLivedToken: string = tokenData.access_token;
    const igUserId: string = String(tokenData.user_id);

    // ──────────────────────────────────────────────
    // Step 2: Exchange for long-lived token (60 days)
    // Uses graph.instagram.com
    // ──────────────────────────────────────────────
    const longLivedUrl = new URL('https://graph.instagram.com/access_token');
    longLivedUrl.searchParams.set('grant_type', 'ig_exchange_token');
    longLivedUrl.searchParams.set('client_secret', appSecret);
    longLivedUrl.searchParams.set('access_token', shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString(), { method: 'GET' });
    const longLivedData = await longLivedRes.json();

    const activeToken: string = longLivedData.access_token || shortLivedToken;
    const expiresInSeconds: number = longLivedData.expires_in || 60 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // ──────────────────────────────────────────────
    // Step 3: Fetch Instagram profile info
    // ──────────────────────────────────────────────
    const profileUrl = new URL(`https://graph.instagram.com/v26.0/me`);
    profileUrl.searchParams.set('fields', 'user_id,username,name,profile_picture_url,account_type');
    profileUrl.searchParams.set('access_token', activeToken);

    const profileRes = await fetch(profileUrl.toString(), { method: 'GET' });
    const profileData = await profileRes.json();

    const igUsername: string = profileData.username || '';
    const igName: string = profileData.name || '';
    const accountType: string = profileData.account_type || '';

    // ──────────────────────────────────────────────
    // Step 4: Store credentials in Supabase
    // ──────────────────────────────────────────────
    const supabase = getSupabaseAdmin();

    try {
      await supabase
        .from('settings')
        .upsert(
          {
            id: 1,
            ig_user_id: igUserId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      await supabase.from('kv').upsert([
        {
          key: 'ig_access_token',
          value: {
            token: activeToken,
            user_id: igUserId,
            username: igUsername,
            name: igName,
            account_type: accountType,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
        },
      ]);
    } catch (dbErr) {
      console.warn('Could not persist to Supabase immediately:', dbErr);
    }

    // ──────────────────────────────────────────────
    // Step 5: Redirect back to settings with success
    // ──────────────────────────────────────────────
    const successUrl = new URL(`${origin}/settings`);
    successUrl.searchParams.set('status', 'connected');
    if (igUsername) {
      successUrl.searchParams.set('username', igUsername);
    }

    const response = NextResponse.redirect(successUrl.toString());
    response.cookies.delete('ig_oauth_state');

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown authentication error';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`);
  }
}
