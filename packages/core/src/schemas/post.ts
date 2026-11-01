import { z } from 'zod';

export const PostSource = z.enum(['manual', 'agent']);
export type PostSource = z.infer<typeof PostSource>;

export const MediaType = z.enum(['REELS', 'IMAGE', 'CAROUSEL']);
export type MediaType = z.infer<typeof MediaType>;

export const PostStatus = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'publishing',
  'posted',
  'failed',
  'rejected',
]);
export type PostStatus = z.infer<typeof PostStatus>;

export const AudioMode = z.enum(['none', 'baked', 'ig_audio']);
export type AudioMode = z.infer<typeof AudioMode>;

export const AudioConfig = z.object({
  mode: AudioMode,
  asset_id: z.string().uuid().optional(),
  ig_audio_id: z.string().optional(),
  audio_volume: z.number().min(0).max(1).optional(),
  video_volume: z.number().min(0).max(1).optional(),
});
export type AudioConfig = z.infer<typeof AudioConfig>;

export const PostSchema = z.object({
  id: z.string().uuid(),
  source: PostSource,
  media_type: MediaType,
  status: PostStatus,
  caption: z.string().max(2200).default(''),
  alt_text: z.string().nullish(),
  credit: z.string().nullish(),
  is_ai_generated: z.boolean().default(false),
  media_paths: z.array(z.string()).default([]),
  audio: AudioConfig.nullish(),
  scheduled_at: z.string().datetime().nullish(),
  ig_container_id: z.string().nullish(),
  ig_media_id: z.string().nullish(),
  ig_permalink: z.string().nullish(),
  attempts: z.number().int().default(0),
  error: z.string().nullish(),
  niche_id: z.string().uuid().nullish(),
  meta: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Post = z.infer<typeof PostSchema>;
