import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
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
  const configId = process.env.IG_CONFIG_ID;

  if (!['instagram_login', 'facebook_login'].includes(authMode)) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?error=${encodeURIComponent('IG_AUTH_MODE must be instagram_login or facebook_login')}`,
    );
  }

  if (!appId || !appSecret || (authMode === 'facebook_login' && !configId)) {
    const message =
      authMode === 'instagram_login'
        ? 'Direct Instagram Login needs IG_CLIENT_ID and IG_CLIENT_SECRET from Meta > Instagram > API setup with Instagram Login. Do not use the Meta App ID.'
        : 'Facebook Login needs META_APP_ID, META_APP_SECRET, and IG_CONFIG_ID from Meta Login for Business.';
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?error=${encodeURIComponent(message)}`,
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  // CSRF state token
  const state = crypto.randomBytes(24).toString('hex');

  const authUrl = new URL(
    authMode === 'facebook_login'
      ? 'https://www.facebook.com/dialog/oauth'
      : 'https://www.instagram.com/oauth/authorize',
  );
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  if (authMode === 'facebook_login') {
    authUrl.searchParams.set('config_id', configId!);
    authUrl.searchParams.set('override_default_response_type', 'true');
  } else {
    authUrl.searchParams.set(
      'scope',
      'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights',
    );
  }

  const response = NextResponse.redirect(authUrl.toString());

  // Store state in secure cookie for verification in callback
  response.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
