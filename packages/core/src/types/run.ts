import { z } from 'zod';

export const RunKind = z.enum(['agent_post', 'manual_ingest', 'publish', 'insights_sync']);
export type RunKind = z.infer<typeof RunKind>;

export const RunMode = z.enum(['assisted', 'auto']);
export type RunMode = z.infer<typeof RunMode>;

export const RunStatus = z.enum([
  'queued',
  'running',
  'waiting_user',
  'done',
  'failed',
  'cancelled',
]);
export type RunStatus = z.infer<typeof RunStatus>;

export const RunStepKey = z.enum([
  'niche',
  'find_backgrounds',
  'pick',
  'edit',
  'caption',
  'music',
  'publish',
]);
export type RunStepKey = z.infer<typeof RunStepKey>;

export const StepStatus = z.enum([
  'pending',
  'running',
  'waiting_user',
  'done',
  'failed',
  'skipped',
]);
export type StepStatus = z.infer<typeof StepStatus>;

export interface Run {
  id: string;
  kind: RunKind;
  mode: RunMode;
  status: RunStatus;
  input: Record<string, unknown>;
  post_id: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface RunStep {
  id: string;
  run_id: string;
  key: RunStepKey;
  status: StepStatus;
  payload: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}
