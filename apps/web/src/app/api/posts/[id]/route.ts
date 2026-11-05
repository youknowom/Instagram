import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getInstagramAccountId } from '@/lib/instagram';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId)
      return NextResponse.json({ error: 'Connect an Instagram account first' }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const allowedKeys = ['status', 'caption', 'scheduled_at', 'meta', 'media_paths'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedKeys.includes(key)),
    );
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No supported post fields were provided' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('instagram_user_id', accountId)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId)
      return NextResponse.json({ error: 'Connect an Instagram account first' }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('instagram_user_id', accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
