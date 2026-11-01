import { z } from 'zod';

export const SettingsSchema = z.object({
  id: z.literal(1).default(1),
  owner: z.string().uuid().nullish(),
  paused: z.boolean().default(false),
  require_approval: z.boolean().default(true),
  live_publish_enabled: z.boolean().default(false),
  timezone: z.string().default('Asia/Kolkata'),
  max_posts_per_day: z.number().int().positive().default(2),
});
export type Settings = z.infer<typeof SettingsSchema>;
