import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getInstagramAccountId } from '@/lib/instagram';

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
  return (
    Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) -
    date.getTime()
  );
}

function startOfTimeZoneDay(date: Date, timeZone: string) {
  const parts = getTimeZoneDateParts(date, timeZone);
  const approximate = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return new Date(approximate - getTimeZoneOffset(new Date(approximate), timeZone));
}

export async function GET(request: NextRequest) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId)
      return NextResponse.json(
        { posts: [], error: 'Connect an Instagram account first' },
        { status: 401 },
      );
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('instagram_user_id', accountId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'queued') {
        query = query.in('status', ['pending_approval', 'approved']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch error:', error);
      return NextResponse.json({ posts: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, posts: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId)
      return NextResponse.json(
        { error: 'Connect an Instagram account before creating posts' },
        { status: 401 },
      );
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const {
      source = 'agent',
      media_type = 'IMAGE',
      status = 'pending_approval',
      caption = '',
      alt_text = '',
      media_paths = [],
      scheduled_at = null,
      meta = {},
    } = body;

    const { data: settingsData, error: settingsError } = await supabase
      .from('kv')
      .select('value')
      .eq('key', `account_settings:${accountId}`)
      .maybeSingle();
    if (settingsError) throw new Error(settingsError.message);
    const accountSettings = settingsData?.value as
      | {
          requireApproval?: boolean;
          maxPostsPerDay?: number;
          timezone?: string;
        }
      | undefined;
    const postStatus =
      accountSettings?.requireApproval === false && status === 'pending_approval'
        ? 'approved'
        : status;
    const timezone = accountSettings?.timezone || 'UTC';
    const scheduledAt = scheduled_at ? new Date(scheduled_at) : new Date();
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: 'Choose a valid publishing date and time' },
        { status: 400 },
      );
    }
    const dayStart = startOfTimeZoneDay(scheduledAt, timezone);
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dayEnd = startOfTimeZoneDay(nextDay, timezone);
    const { count, error: limitError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('instagram_user_id', accountId)
      .in('status', ['pending_approval', 'approved', 'publishing', 'posted'])
      .gte('scheduled_at', dayStart.toISOString())
      .lt('scheduled_at', dayEnd.toISOString());
    if (limitError) throw new Error(limitError.message);
    const maxPostsPerDay = accountSettings?.maxPostsPerDay ?? 2;
    if ((count || 0) >= maxPostsPerDay) {
      return NextResponse.json(
        { error: `This account has reached its limit of ${maxPostsPerDay} posts for that day.` },
        { status: 429 },
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          instagram_user_id: accountId,
          source,
          media_type,
          status: postStatus,
          caption,
          alt_text,
          media_paths: Array.isArray(media_paths) ? media_paths : [media_paths],
          scheduled_at: scheduledAt.toISOString(),
          is_ai_generated: source === 'agent',
          meta,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
