import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getInstagramAccountId } from '@/lib/instagram';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const accountId = getInstagramAccountId(request);
  if (!accountId)
    return NextResponse.json(
      { error: 'Connect an Instagram account before uploading media' },
      { status: 401 },
    );

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File))
      return NextResponse.json({ error: 'Choose an image file to upload' }, { status: 400 });
    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Choose a JPEG, PNG, or WebP image' }, { status: 415 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image uploads are limited to 8 MB' }, { status: 413 });
    }

    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${accountId}/${randomUUID()}.${extension}`;
    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('media-public')
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        instagram_user_id: accountId,
        kind: 'upload',
        provider: 'User upload',
        storage_path: path,
        meta: { title: file.name, mime_type: file.type, size_bytes: file.size, tags: [] },
      })
      .select('id,storage_path,meta,created_at')
      .single();
    if (assetError) {
      await supabase.storage.from('media-public').remove([path]);
      throw new Error(assetError.message);
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        url: supabase.storage.from('media-public').getPublicUrl(asset.storage_path).data.publicUrl,
        title: file.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
