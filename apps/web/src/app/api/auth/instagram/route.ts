import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const appId = process.env.IG_APP_ID || '1821300645679917';
  const configId = process.env.IG_CONFIG_ID || '1159997720042616';

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  // CSRF state token
  const state = crypto.randomBytes(24).toString('hex');

  // Meta Unified Login URL using your configuration
  const authUrl = new URL('https://www.facebook.com/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('config_id', configId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

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
