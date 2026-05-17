import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Lightweight mock so we don't need the full Next.js runtime in Vitest
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      // make the shape easy to assert on in tests
      _data: data,
      json: async () => data,
    }),
  },
}));

// ─── Helper types ────────────────────────────────────────────────────────────
type MockResponse = { status: number; _data: unknown; json: () => Promise<unknown> };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(lat: string | null, lon: string | null) {
  const params = new URLSearchParams();
  if (lat !== null) params.set('lat', lat);
  if (lon !== null) params.set('lon', lon);
  return new Request(`https://example.com/api/reverse?${params}`);
}

const nomiatimData = { address: { city: 'Sao Paulo', country: 'Brasil' } };

function mockFetchOk(data = nomiatimData) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => data,
    text: async () => '',
  } as Response);
}

function mockFetchError(status = 503) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status,
    text: async () => 'service unavailable',
  } as Response);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/reverse', () => {
  // Reset module state (cache + lastRequestAt) before every test
  let GET: (req: Request) => Promise<MockResponse>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/app/api/reverse/route');
    GET = mod.GET as unknown as typeof GET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── Param validation ──────────────────────────────────────────────────────

  it('returns 400 when both lat and lon are missing', async () => {
    const res = await GET(makeRequest(null, null));
    expect(res.status).toBe(400);
    expect((res._data as any).error).toMatch(/missing/i);
  });

  it('returns 400 when lat is missing', async () => {
    const res = await GET(makeRequest(null, '10'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when lon is missing', async () => {
    const res = await GET(makeRequest('10', null));
    expect(res.status).toBe(400);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('calls Nominatim and returns 200 with the response data', async () => {
    const fetchSpy = mockFetchOk();

    const res = await GET(makeRequest('-23.55', '-46.63'));

    expect(res.status).toBe(200);
    expect(res._data).toEqual(nomiatimData);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('LugaresDoMundo') }),
      })
    );
  });

  // ── Cache ─────────────────────────────────────────────────────────────────

  it('returns cached response on a second request without calling fetch again', async () => {
    const fetchSpy = mockFetchOk();

    await GET(makeRequest('10.00001', '20.00001'));
    const res = await GET(makeRequest('10.00001', '20.00001'));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce(); // second call served from cache
  });

  it('uses the same cache entry for coordinates that round to the same 5-decimal key', async () => {
    const fetchSpy = mockFetchOk();

    // These both normalise to "10.00000,20.00000"
    await GET(makeRequest('10.000001', '20.000001'));
    await GET(makeRequest('10.000002', '20.000002'));

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('calls Nominatim again after the 24-hour TTL expires', async () => {
    vi.useFakeTimers();
    // Start at 2 s so that the first call does not hit the throttle
    // (lastRequestAt=0, since = 2000 - 0 = 2000 >= 1000)
    vi.setSystemTime(2000);

    const fetchSpy = mockFetchOk();

    await GET(makeRequest('5', '5'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 25 hours past the initial timestamp
    vi.setSystemTime(2000 + 1000 * 60 * 60 * 25);

    await GET(makeRequest('5', '5'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // ── Throttle ──────────────────────────────────────────────────────────────

  it('waits for 1 s between Nominatim calls when requests are too close together', async () => {
    vi.useFakeTimers();
    // Start at 2 s: first call won't hit throttle (since = 2000 - 0 >= 1000)
    vi.setSystemTime(2000);

    mockFetchOk();

    // First request at t=2000 ms – sets lastRequestAt=2000
    await GET(makeRequest('1', '1'));

    // Advance only 200 ms (< 1 s throttle window)
    vi.setSystemTime(2200);

    // Second request on a different coordinate (cache miss) – will sleep 800 ms
    const secondRequest = GET(makeRequest('2', '2'));

    // Advance the remaining 800 ms so the sleep resolves
    await vi.advanceTimersByTimeAsync(800);
    const res = await secondRequest;

    expect(res.status).toBe(200);
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns 502 when Nominatim responds with a non-ok status', async () => {
    mockFetchError(503);

    const res = await GET(makeRequest('-23.55', '-46.63'));

    expect(res.status).toBe(502);
    expect((res._data as any).error).toBe('Nominatim error');
    expect((res._data as any).status).toBe(503);
  });

  it('returns 500 on an unexpected thrown error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    const res = await GET(makeRequest('-23.55', '-46.63'));

    expect(res.status).toBe(500);
    expect((res._data as any).error).toBe('network failure');
  });
});
