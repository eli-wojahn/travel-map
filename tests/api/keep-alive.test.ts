import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      _data: data,
      json: async () => data,
    }),
  },
}));

const limitMock = vi.fn();
const selectMock = vi.fn(() => ({ limit: limitMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

type MockResponse = { status: number; _data: unknown; json: () => Promise<unknown> };

function makeRequest(secret?: string, headerName = 'authorization') {
  const headers = new Headers();

  if (secret) {
    if (headerName === 'authorization') {
      headers.set('authorization', `Bearer ${secret}`);
    } else {
      headers.set(headerName, secret);
    }
  }

  return new Request('https://example.com/api/keep-alive', { headers });
}

describe('GET /api/keep-alive', () => {
  let GET: (request: Request) => Promise<MockResponse>;
  const originalEnv = process.env.KEEP_ALIVE_SECRET;

  beforeEach(async () => {
    vi.resetModules();
    process.env.KEEP_ALIVE_SECRET = 'test-secret';
    limitMock.mockReset();
    selectMock.mockClear();
    fromMock.mockClear();

    const mod = await import('@/app/api/keep-alive/route');
    GET = mod.GET as unknown as typeof GET;
  });

  it('returns 500 when keep-alive secret is not configured', async () => {
    delete process.env.KEEP_ALIVE_SECRET;

    const res = await GET(makeRequest('test-secret'));

    expect(res.status).toBe(500);
    expect((res._data as any).error).toMatch(/not configured/i);
  });

  it('returns 401 when request is missing a valid secret', async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('accepts the x-keep-alive-secret header', async () => {
    limitMock.mockResolvedValue({ error: null });

    const res = await GET(makeRequest('test-secret', 'x-keep-alive-secret'));

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith('places');
    expect(selectMock).toHaveBeenCalledWith('id');
    expect(limitMock).toHaveBeenCalledWith(1);
  });

  it('returns 503 when the Supabase probe fails', async () => {
    limitMock.mockResolvedValue({ error: { message: 'relation places does not exist' } });

    const res = await GET(makeRequest('test-secret'));

    expect(res.status).toBe(503);
    expect((res._data as any).details).toMatch(/relation places/i);
  });

  it('returns 200 when the Supabase probe succeeds', async () => {
    limitMock.mockResolvedValue({ error: null });

    const res = await GET(makeRequest('test-secret'));

    expect(res.status).toBe(200);
    expect((res._data as any).success).toBe(true);
    expect((res._data as any).checkedAt).toEqual(expect.any(String));
  });
});