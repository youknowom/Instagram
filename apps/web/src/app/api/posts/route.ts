import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('posts')
      .select('*')
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
      return NextResponse.json({ posts: [] });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, posts: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          source,
          media_type,
          status,
          caption,
          alt_text,
          media_paths: Array.isArray(media_paths) ? media_paths : [media_paths],
          scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : new Date().toISOString(),
          is_ai_generated: true,
          meta,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

