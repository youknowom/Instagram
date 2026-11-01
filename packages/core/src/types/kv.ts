export interface TokenEntry {
  token: string;
  refreshed_at: string;
  expires_at: string;
  status: 'valid' | 'invalid' | 'expired';
}

export interface KVEntry<T = unknown> {
  key: string;
  value: T;
  updated_at: string;
}
