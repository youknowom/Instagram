import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 1. Fetch post from Supabase
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 2. Retrieve active Instagram token
    const { data: kvData } = await supabase
      .from('kv')
      .select('value')
      .eq('key', 'ig_access_token')
      .maybeSingle();

    const tokenInfo = kvData?.value as {
      token?: string;
      user_id?: string;
      username?: string;
    } | undefined;

    const accessToken = tokenInfo?.token || process.env.IG_INITIAL_TOKEN;
    const igUserId = tokenInfo?.user_id || process.env.IG_USER_ID;

    if (!accessToken || !igUserId) {
      return NextResponse.json(
        { error: 'No Instagram account connected. Please connect in Settings first.' },
        { status: 400 }
      );
    }

    // Check media path
    const imageUrl = post.media_paths?.[0];
    if (!imageUrl) {
      return NextResponse.json({ error: 'Post has no media attached' }, { status: 400 });
    }

    // Update status to publishing
    await supabase.from('posts').update({ status: 'publishing' }).eq('id', id);

    // 3. Create Instagram Container
    const containerUrl = new URL(`https://graph.facebook.com/v26.0/${igUserId}/media`);
    containerUrl.searchParams.set('image_url', imageUrl);
    containerUrl.searchParams.set('caption', post.caption || '');
    containerUrl.searchParams.set('access_token', accessToken);

    const containerRes = await fetch(containerUrl.toString(), { method: 'POST' });
    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      const errMsg = containerData?.error?.message || 'Failed to create Instagram container';
      await supabase
        .from('posts')
        .update({ status: 'failed', error: errMsg })
        .eq('id', id);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const containerId = containerData.id;

    // Small delay to ensure container processing is ready
    await new Promise((res) => setTimeout(res, 2000));

    // 4. Publish Container
    const publishUrl = new URL(`https://graph.facebook.com/v26.0/${igUserId}/media_publish`);
    publishUrl.searchParams.set('creation_id', containerId);
    publishUrl.searchParams.set('access_token', accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      const errMsg = publishData?.error?.message || 'Failed to publish to Instagram';
      await supabase
        .from('posts')
        .update({ status: 'failed', error: errMsg })
        .eq('id', id);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const publishedId = publishData.id;

    // 5. Update post to posted
    const { data: updatedPost } = await supabase
      .from('posts')
      .update({
        status: 'posted',
        ig_media_id: publishedId,
        ig_container_id: containerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      mediaId: publishedId,
      post: updatedPost,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
