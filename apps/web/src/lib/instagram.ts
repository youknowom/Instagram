import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const INSTAGRAM_SESSION_COOKIE = 'ig_session';
export const INSTAGRAM_GRAPH_VERSION = process.env.IG_GRAPH_API_VERSION || 'v26.0';

export function getInstagramGraphUrl(path: string) {
  const host =
    process.env.IG_AUTH_MODE === 'facebook_login'
      ? 'https://graph.facebook.com'
      : 'https://graph.instagram.com';
  return `${host}/${INSTAGRAM_GRAPH_VERSION}/${path.replace(/^\//, '')}`;
}

export function getInstagramProfilePath(accountId: string) {
  return process.env.IG_AUTH_MODE === 'facebook_login' ? accountId : 'me';
}

export function getInstagramProfileFields() {
  return process.env.IG_AUTH_MODE === 'facebook_login'
    ? 'id,username,name,profile_picture_url,account_type,followers_count,follows_count,media_count'
    : 'user_id,username,account_type,media_count';
}

export function getInstagramMediaPath(accountId: string) {
  return process.env.IG_AUTH_MODE === 'facebook_login' ? `${accountId}/media` : 'me/media';
}

export interface InstagramTokenInfo {
  token?: string;
  user_id?: string;
  username?: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
  expires_at?: string;
}

function getSessionSecret() {
  const secret = process.env.IG_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Instagram session signing secret is not configured');
  return secret;
}

export function createInstagramSession(userId: string) {
  const signature = createHmac('sha256', getSessionSecret()).update(userId).digest('base64url');
  return `${userId}.${signature}`;
}

export function getInstagramAccountId(request: NextRequest) {
  const value = request.cookies.get(INSTAGRAM_SESSION_COOKIE)?.value;
  if (!value) return null;

  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const userId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  try {
    const expected = createHmac('sha256', getSessionSecret()).update(userId).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function getInstagramTokenInfo(
  supabase: SupabaseClient,
  accountId: string,
): Promise<InstagramTokenInfo | null> {
  const { data, error } = await supabase
    .from('kv')
    .select('value')
    .eq('key', `ig_access_token:${accountId}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.value as InstagramTokenInfo | undefined) ?? null;
}
