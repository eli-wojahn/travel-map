import { NextResponse } from 'next/server';

// Simple in-memory cache and naive throttle (suitable for development / low traffic).
const cache = new Map<string, { ts: number; data: any }>();
let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
    }

    // Normalize key (round to 5 decimals to increase cache hits)
    const key = `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;

    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < 1000 * 60 * 60 * 24) {
      return NextResponse.json(cached.data, { status: 200 });
    }

    // Naive throttle: ensure at least 1s between requests to Nominatim
    const since = now - lastRequestAt;
    if (since < 1000) {
      await sleep(1000 - since);
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&addressdetails=1`;

    // Identify our application per Nominatim policy
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LugaresDoMundo/1.0 (https://github.com/eli-wojahn)'
      },
    });

    lastRequestAt = Date.now();

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Nominatim error', status: res.status, body: text }, { status: 502 });
    }

    const data = await res.json();

    // Cache result
    cache.set(key, { ts: Date.now(), data });

    // Return upstream response JSON to client
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
