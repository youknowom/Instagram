import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getInstagramAccountId } from '@/lib/instagram';

export async function GET(request: NextRequest) {
  const accountId = getInstagramAccountId(request);
  if (!accountId)
    return NextResponse.json(
      { assets: [], error: 'Connect an Instagram account first' },
      { status: 401 },
    );

  try {
    const supabase = getSupabaseAdmin();
    const [assetResult, postResult] = await Promise.all([
      supabase
        .from('assets')
        .select('id,kind,provider,storage_path,credit,meta,created_at')
        .eq('instagram_user_id', accountId)
        .order('created_at', { ascending: false }),
      supabase
        .from('posts')
        .select('id,caption,media_paths,meta,created_at')
        .eq('instagram_user_id', accountId)
        .order('created_at', { ascending: false }),
    ]);
    if (assetResult.error) throw new Error(assetResult.error.message);
    if (postResult.error) throw new Error(postResult.error.message);

    const assets = (assetResult.data || []).map((asset) => {
      const path = asset.storage_path || '';
      const publicUrl = path.startsWith('http')
        ? path
        : path
          ? supabase.storage.from('media-public').getPublicUrl(path).data.publicUrl
          : '';
      return {
        id: asset.id,
        title: (asset.meta as Record<string, string> | null)?.title || asset.kind,
        provider: asset.provider || 'Uploaded media',
        url: publicUrl,
        tags: (asset.meta as Record<string, string[]> | null)?.tags || [],
        createdAt: asset.created_at,
      };
    });

    const postAssets = (postResult.data || []).flatMap((post) =>
      (post.media_paths || [])
        .filter((url: string) => /^https?:\/\//i.test(url))
        .map((url: string, index: number) => ({
          id: `${post.id}-${index}`,
          title:
            (post.meta as Record<string, string> | null)?.quote ||
            post.caption.slice(0, 80) ||
            'Post media',
          provider: 'Instagram post media',
          url,
          tags: (post.meta as Record<string, string> | null)?.niche
            ? [(post.meta as Record<string, string>).niche]
            : [],
          createdAt: post.created_at,
        })),
    );

    const uniqueAssets = new Map([...assets, ...postAssets].map((asset) => [asset.url, asset]));
    return NextResponse.json(
      { assets: [...uniqueAssets.values()] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load media library';
    return NextResponse.json({ error: message, assets: [] }, { status: 500 });
  }
}
