import { z } from 'zod';

export const TextEffectSchema = z.object({
  shadow: z
    .object({
      color: z.string(),
      blur: z.number(),
      offsetX: z.number(),
      offsetY: z.number(),
    })
    .optional(),
  glow: z
    .object({
      color: z.string(),
      blur: z.number(),
    })
    .optional(),
  outline: z
    .object({
      color: z.string(),
      width: z.number(),
    })
    .optional(),
  gradientFill: z
    .object({
      colors: z.array(z.string()).min(2),
      angle: z.number().default(0),
    })
    .optional(),
});
export type TextEffect = z.infer<typeof TextEffectSchema>;

export const TextObjectSchema = z.object({
  id: z.string(),
  content: z.string(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.number().default(400),
  color: z.string().default('#FFFFFF'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  letterSpacing: z.number().default(0),
  lineHeight: z.number().positive().default(1.2),
  left: z.number(),
  top: z.number(),
  width: z.number().positive(),
  angle: z.number().default(0),
  effects: TextEffectSchema.optional(),
});
export type TextObject = z.infer<typeof TextObjectSchema>;

export const ImageAdjustmentsSchema = z.object({
  brightness: z.number().min(-1).max(1).default(0),
  contrast: z.number().min(-1).max(1).default(0),
  saturation: z.number().min(-1).max(1).default(0),
  blur: z.number().min(0).max(20).default(0),
  vignette: z.number().min(0).max(1).default(0),
});
export type ImageAdjustments = z.infer<typeof ImageAdjustmentsSchema>;

export const ScrimSchema = z.object({
  enabled: z.boolean().default(true),
  color: z.string().default('#000000'),
  opacity: z.number().min(0).max(1).default(0.4),
  direction: z.enum(['top', 'bottom', 'full']).default('full'),
});
export type Scrim = z.infer<typeof ScrimSchema>;

export const EditorSpecSchema = z.object({
  version: z.literal(1).default(1),
  canvas: z.object({
    width: z.number().default(1080),
    height: z.number().default(1350),
  }),
  background: z.object({
    asset_id: z.string().uuid().optional(),
    url: z.string().url().optional(),
    fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
    panX: z.number().default(0),
    panY: z.number().default(0),
    zoom: z.number().min(1).default(1),
    adjustments: ImageAdjustmentsSchema.optional(),
  }),
  scrim: ScrimSchema.optional(),
  texts: z.array(TextObjectSchema).default([]),
  preset_id: z.string().optional(),
});
export type EditorSpec = z.infer<typeof EditorSpecSchema>;
