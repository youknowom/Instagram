import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getInstagramAccountId } from '@/lib/instagram';

const DEFAULT_SETTINGS = {
  livePublishEnabled: false,
  requireApproval: true,
  maxPostsPerDay: 2,
};

export async function GET(request: NextRequest) {
  const requestedTimezone = request.nextUrl.searchParams.get('timezone') || 'UTC';
  let timezone = 'UTC';
  try {
    timezone = new Intl.DateTimeFormat('en', { timeZone: requestedTimezone }).resolvedOptions()
      .timeZone;
  } catch {
    timezone = 'UTC';
  }
  const defaultSettings = { ...DEFAULT_SETTINGS, timezone };
  const accountId = getInstagramAccountId(request);
  if (!accountId) return NextResponse.json({ settings: defaultSettings, connected: false });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('kv')
      .select('value')
      .eq('key', `account_settings:${accountId}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json(
      {
        settings: { ...defaultSettings, ...(data?.value as Record<string, unknown> | undefined) },
        connected: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const accountId = getInstagramAccountId(request);
  if (!accountId)
    return NextResponse.json(
      { error: 'Connect an Instagram account before saving settings' },
      { status: 401 },
    );

  try {
    const body = await request.json();
    const settings = {
      livePublishEnabled: Boolean(body.livePublishEnabled),
      requireApproval: Boolean(body.requireApproval),
      maxPostsPerDay: Math.min(
        10,
        Math.max(1, Number(body.maxPostsPerDay) || DEFAULT_SETTINGS.maxPostsPerDay),
      ),
      timezone: 'UTC',
    };
    if (typeof body.timezone === 'string') {
      try {
        settings.timezone = new Intl.DateTimeFormat('en', {
          timeZone: body.timezone,
        }).resolvedOptions().timeZone;
      } catch {
        return NextResponse.json({ error: 'Enter a valid IANA timezone' }, { status: 400 });
      }
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('kv')
      .upsert(
        {
          key: `account_settings:${accountId}`,
          value: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
