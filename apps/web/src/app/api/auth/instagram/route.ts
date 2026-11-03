import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const appId = process.env.IG_APP_ID;

  if (!appId) {
    return NextResponse.json(
      { error: 'IG_APP_ID is not configured in environment variables' },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  // CSRF state token
  const state = crypto.randomBytes(24).toString('hex');

  // Permissions required for PostPilot:
  // - instagram_basic: read account info & media
  // - instagram_content_publish: auto-publish posts/reels
  // - pages_read_engagement: read page engagement
  // - pages_show_list: locate linked Facebook pages
  // - business_management: access business assets
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'pages_show_list',
    'business_management',
  ].join(',');

  const authUrl = new URL('https://www.facebook.com/v26.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
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
