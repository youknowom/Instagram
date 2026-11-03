import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

interface PageAccount {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramAccount;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle user declining or Meta errors
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
    // 1. Exchange authorization code for short-lived user access token
    const tokenUrl = new URL('https://graph.facebook.com/v26.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      const err = tokenData?.error?.message || 'Failed to exchange authorization code';
      return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(err)}`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived user token (60-day expiry)
    const longLivedUrl = new URL('https://graph.facebook.com/v26.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', appId);
    longLivedUrl.searchParams.set('client_secret', appSecret);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString(), { method: 'GET' });
    const longLivedData = await longLivedRes.json();

    const activeUserToken = longLivedData.access_token || shortLivedToken;
    const expiresInSeconds = longLivedData.expires_in || 60 * 24 * 60 * 60; // 60 days default
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // 3. Find connected Instagram Professional / Business account
    const accountsUrl = new URL('https://graph.facebook.com/v26.0/me/accounts');
    accountsUrl.searchParams.set(
      'fields',
      'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}'
    );
    accountsUrl.searchParams.set('access_token', activeUserToken);

    const accountsRes = await fetch(accountsUrl.toString(), { method: 'GET' });
    const accountsData = await accountsRes.json();

    let igAccountId = '';
    let igUsername = '';
    let pageAccessToken = activeUserToken;

    if (accountsData.data && Array.isArray(accountsData.data)) {
      for (const page of accountsData.data as PageAccount[]) {
        if (page.instagram_business_account) {
          igAccountId = page.instagram_business_account.id;
          igUsername = page.instagram_business_account.username;
          // A page access token derived from a 60-day user token never expires
          pageAccessToken = page.access_token || activeUserToken;
          break;
        }
      }
    }

    // Fallback: If not linked through a page directly, check /me
    if (!igAccountId) {
      const meUrl = `https://graph.facebook.com/v26.0/me?fields=id,name&access_token=${activeUserToken}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();
      igAccountId = meData.id || '';
      igUsername = meData.name || 'connected_creator';
    }

    // 4. Save credentials to Supabase
    const supabase = getSupabaseAdmin();

    try {
      // Store in settings table
      await supabase
        .from('settings')
        .upsert(
          {
            id: 1,
            ig_user_id: igAccountId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      // Store tokens in kv key-value table
      await supabase.from('kv').upsert([
        {
          key: 'ig_access_token',
          value: {
            token: pageAccessToken,
            user_id: igAccountId,
            username: igUsername,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
        },
      ]);
    } catch (dbErr) {
      console.warn('Could not persist to Supabase immediately:', dbErr);
    }

    // Redirect to settings with success
    const successUrl = new URL(`${origin}/settings`);
    successUrl.searchParams.set('status', 'connected');
    if (igUsername) {
      successUrl.searchParams.set('username', igUsername);
    }

    const response = NextResponse.redirect(successUrl.toString());

    // Clear state cookie
    response.cookies.delete('ig_oauth_state');

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown authentication error';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`);
  }
}
