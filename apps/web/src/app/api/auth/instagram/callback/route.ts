import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  createInstagramSession,
  INSTAGRAM_GRAPH_VERSION,
  INSTAGRAM_SESSION_COOKIE,
} from '@/lib/instagram';

interface InstagramProfile {
  id?: string;
  user_id?: string;
  username?: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
}

interface StoredAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  accountType: string;
  token: string;
  expiresInSeconds: number;
}

function instagramError(
  data: { error?: { message?: string }; error_message?: string },
  fallback: string,
) {
  return data?.error?.message || data?.error_message || fallback;
}

async function getInstagramLoginAccount(
  code: string,
  origin: string,
  appId: string,
  appSecret: string,
) {
  const redirectUri = `${origin}/api/auth/instagram/callback`;
  const form = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });
  const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    cache: 'no-store',
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      instagramError(tokenData, 'Could not exchange the Instagram authorization code'),
    );
  }

  const exchangeUrl = new URL('https://graph.instagram.com/access_token');
  exchangeUrl.searchParams.set('grant_type', 'ig_exchange_token');
  exchangeUrl.searchParams.set('client_secret', appSecret);
  exchangeUrl.searchParams.set('access_token', tokenData.access_token);
  const longTokenResponse = await fetch(exchangeUrl, { cache: 'no-store' });
  const longTokenData = await longTokenResponse.json();
  const token =
    longTokenResponse.ok && longTokenData.access_token
      ? (longTokenData.access_token as string)
      : (tokenData.access_token as string);
  const expiresInSeconds = Number(longTokenData.expires_in || tokenData.expires_in || 60 * 60);

  const profileUrl = new URL(`https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/me`);
  profileUrl.searchParams.set('fields', 'user_id,username,account_type,media_count');
  profileUrl.searchParams.set('access_token', token);
  const profileResponse = await fetch(profileUrl, { cache: 'no-store' });
  const profile = (await profileResponse.json()) as InstagramProfile & {
    error?: { message?: string };
  };
  if (!profileResponse.ok) {
    throw new Error(instagramError(profile, 'Could not load the connected Instagram profile'));
  }

  const id = profile.user_id || profile.id || tokenData.user_id;
  if (!id) throw new Error('Instagram did not return an account ID');

  return {
    id: String(id),
    username: profile.username || '',
    name: profile.name || '',
    profilePictureUrl: profile.profile_picture_url || '',
    accountType: profile.account_type || '',
    token,
    expiresInSeconds,
  } satisfies StoredAccount;
}

async function getFacebookLoginAccount(
  code: string,
  origin: string,
  appId: string,
  appSecret: string,
) {
  const redirectUri = `${origin}/api/auth/instagram/callback`;
  const tokenUrl = new URL('https://graph.facebook.com/oauth/access_token');
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);
  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(instagramError(tokenData, 'Could not exchange the Meta authorization code'));
  }

  const token = tokenData.access_token as string;
  // Unified Login returns a business integration system user token. Discover
  // the Instagram assets granted to that user instead of looking for Pages.
  const accountsUrl = new URL(
    `https://graph.facebook.com/${INSTAGRAM_GRAPH_VERSION}/me/assigned_instagram_accounts`,
  );
  accountsUrl.searchParams.set(
    'fields',
    'id,username,name,profile_picture_url,account_type,followers_count,follows_count,media_count',
  );
  accountsUrl.searchParams.set('access_token', token);
  const accountsResponse = await fetch(accountsUrl, { cache: 'no-store' });
  const accountsData = await accountsResponse.json();
  if (!accountsResponse.ok) {
    throw new Error(
      instagramError(
        accountsData,
        'Could not load the Instagram accounts granted to this Meta login',
      ),
    );
  }

  const profile = (accountsData.data as InstagramProfile[] | undefined)?.[0];
  if (!profile?.id) {
    throw new Error(
      'No Instagram account was granted. Choose an Instagram professional account in the Meta login dialog and try again.',
    );
  }

  return {
    id: String(profile.id),
    username: profile.username || '',
    name: profile.name || '',
    profilePictureUrl: profile.profile_picture_url || '',
    accountType: profile.account_type || '',
    token,
    // This configuration is set to Never. Use the session cap as a fallback
    // metadata expiry when Meta omits expires_in for its system user token.
    expiresInSeconds: Number(tokenData.expires_in || 60 * 60 * 24 * 60),
  } satisfies StoredAccount;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthError = request.nextUrl.searchParams.get('error');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(errorDescription || oauthError)}`,
    );
  }
  if (!code)
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent('No authorization code was received')}`,
    );

  const savedState = request.cookies.get('ig_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent('Security check failed: state parameter mismatch')}`,
    );
  }

  const authMode = process.env.IG_AUTH_MODE || 'instagram_login';
  const appId =
    authMode === 'instagram_login'
      ? process.env.IG_CLIENT_ID
      : authMode === 'facebook_login'
        ? process.env.META_APP_ID
        : undefined;
  const appSecret =
    authMode === 'instagram_login'
      ? process.env.IG_CLIENT_SECRET
      : authMode === 'facebook_login'
        ? process.env.META_APP_SECRET
        : undefined;
  if (!['instagram_login', 'facebook_login'].includes(authMode)) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent('IG_AUTH_MODE must be instagram_login or facebook_login')}`,
    );
  }
  if (!appId || !appSecret) {
    const message =
      authMode === 'instagram_login'
        ? 'Direct Instagram Login needs IG_CLIENT_ID and IG_CLIENT_SECRET from Meta > Instagram > API setup with Instagram Login.'
        : 'Facebook Login needs META_APP_ID and META_APP_SECRET from Meta App Settings > Basic.';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`);
  }

  try {
    const account =
      authMode === 'facebook_login'
        ? await getFacebookLoginAccount(code, origin, appId, appSecret)
        : authMode === 'instagram_login'
          ? await getInstagramLoginAccount(code, origin, appId, appSecret)
          : null;
    if (!account) throw new Error('IG_AUTH_MODE must be instagram_login or facebook_login');

    const expiresAt = new Date(Date.now() + account.expiresInSeconds * 1000).toISOString();
    const supabase = getSupabaseAdmin();
    const { error: saveError } = await supabase.from('kv').upsert(
      {
        key: `ig_access_token:${account.id}`,
        value: {
          token: account.token,
          user_id: account.id,
          username: account.username,
          name: account.name,
          account_type: account.accountType,
          profile_picture_url: account.profilePictureUrl,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
      },
      { onConflict: 'key' },
    );
    if (saveError) throw new Error(`Could not save Instagram connection: ${saveError.message}`);

    // Claim queue rows created before account-scoped ownership was added.
    const { error: claimError } = await supabase
      .from('posts')
      .update({ instagram_user_id: account.id })
      .is('instagram_user_id', null);
    if (claimError) throw new Error(`Could not assign existing posts: ${claimError.message}`);
    const { error: snapshotError } = await supabase
      .from('account_snapshots')
      .update({ instagram_user_id: account.id })
      .is('instagram_user_id', null);
    if (snapshotError)
      throw new Error(`Could not assign existing account history: ${snapshotError.message}`);

    const successUrl = new URL(`${origin}/settings`);
    successUrl.searchParams.set('status', 'connected');
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('ig_oauth_state');
    response.cookies.set(INSTAGRAM_SESSION_COOKIE, createInstagramSession(account.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.min(account.expiresInSeconds, 60 * 24 * 60 * 60),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown authentication error';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`);
  }
}
