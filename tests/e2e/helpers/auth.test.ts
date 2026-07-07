import { describe, expect, it } from 'vitest';

import { getAuthStorageKey } from './auth';

describe('getAuthStorageKey', () => {
  it('deriva a storage key a partir da URL atual do Supabase', () => {
    expect(getAuthStorageKey('https://example.supabase.co')).toBe('sb-example-auth-token');
  });

  it('usa o project ref padrão quando a URL é inválida ou ausente', () => {
    expect(getAuthStorageKey('')).toBe('sb-xeyntotoxjrjyperghmq-auth-token');
    expect(getAuthStorageKey('not-a-url')).toBe('sb-xeyntotoxjrjyperghmq-auth-token');
  });
});
