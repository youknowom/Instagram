import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  getInstagramAccountId,
  getInstagramGraphUrl,
  getInstagramTokenInfo,
} from '@/lib/instagram';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getInstagramAccountId(request);
    if (!accountId) {
      return NextResponse.json({ error: 'Connect an Instagram account first' }, { status: 401 });
    }
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 1. Fetch post from Supabase
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('instagram_user_id', accountId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 2. Retrieve active Instagram token
    const tokenInfo = await getInstagramTokenInfo(supabase, accountId);
    const accessToken = tokenInfo?.token;
    const igUserId = tokenInfo?.user_id;

    if (!accessToken || igUserId !== accountId) {
      return NextResponse.json(
        { error: 'No Instagram account connected. Please connect in Settings first.' },
        { status: 400 },
      );
    }

    const { data: settingsData, error: settingsError } = await supabase
      .from('kv')
      .select('value')
      .eq('key', `account_settings:${accountId}`)
      .maybeSingle();
    if (settingsError) throw new Error(settingsError.message);
    const accountSettings = settingsData?.value as { livePublishEnabled?: boolean } | undefined;
    if (accountSettings?.livePublishEnabled !== true) {
      return NextResponse.json(
        { error: 'Live publishing is disabled. Enable it in Settings before publishing.' },
        { status: 403 },
      );
    }

    // Check media path
    const mediaUrl = post.media_paths?.[0];
    if (!mediaUrl) {
      return NextResponse.json({ error: 'Post has no media attached' }, { status: 400 });
    }

    if (!['IMAGE', 'REELS'].includes(post.media_type)) {
      return NextResponse.json(
        { error: 'Publishing this media type is not configured.' },
        { status: 400 },
      );
    }

    // Update status to publishing
    await supabase
      .from('posts')
      .update({ status: 'publishing' })
      .eq('id', id)
      .eq('instagram_user_id', accountId);

    // 3. Create Instagram Container
    const containerUrl = new URL(getInstagramGraphUrl(`${igUserId}/media`));
    if (post.media_type === 'REELS') {
      containerUrl.searchParams.set('media_type', 'REELS');
      containerUrl.searchParams.set('video_url', mediaUrl);
      containerUrl.searchParams.set('share_to_feed', 'true');
    } else {
      containerUrl.searchParams.set('image_url', mediaUrl);
    }
    containerUrl.searchParams.set('caption', post.caption || '');
    containerUrl.searchParams.set('access_token', accessToken);

    const containerRes = await fetch(containerUrl.toString(), { method: 'POST' });
    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      const errMsg = containerData?.error?.message || 'Failed to create Instagram container';
      await supabase
        .from('posts')
        .update({ status: 'failed', error: errMsg })
        .eq('id', id)
        .eq('instagram_user_id', accountId);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const containerId = containerData.id;

    if (post.media_type === 'REELS') {
      let ready = false;
      let processingError: string | null = null;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const statusUrl = new URL(getInstagramGraphUrl(containerId));
        statusUrl.searchParams.set('fields', 'status_code');
        statusUrl.searchParams.set('access_token', accessToken);
        const statusResponse = await fetch(statusUrl, { cache: 'no-store' });
        const statusData = await statusResponse.json();
        if (
          !statusResponse.ok ||
          statusData.status_code === 'ERROR' ||
          statusData.status_code === 'EXPIRED'
        ) {
          processingError =
            statusData?.error?.message ||
            `Instagram video processing stopped: ${statusData.status_code || statusResponse.status}`;
          break;
        }
        if (statusData.status_code === 'FINISHED') {
          ready = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (!ready) {
        const message =
          processingError ||
          'Instagram is still processing this video. Refresh the queue and try again.';
        await supabase
          .from('posts')
          .update({ status: 'failed', error: message })
          .eq('id', id)
          .eq('instagram_user_id', accountId);
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 4. Publish Container
    const publishUrl = new URL(getInstagramGraphUrl(`${igUserId}/media_publish`));
    publishUrl.searchParams.set('creation_id', containerId);
    publishUrl.searchParams.set('access_token', accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      const errMsg = publishData?.error?.message || 'Failed to publish to Instagram';
      await supabase
        .from('posts')
        .update({ status: 'failed', error: errMsg })
        .eq('id', id)
        .eq('instagram_user_id', accountId);
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
      .eq('instagram_user_id', accountId)
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
