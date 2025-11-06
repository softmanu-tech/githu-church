// Ultra-fast API optimization utilities
import { NextResponse } from 'next/server';

// In-memory cache with ultra-short TTL for maximum speed
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2000; // 2 seconds for ultra-fast updates

export function getCachedData(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(pattern?: string) {
  if (pattern) {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
}

// Ultra-fast API response wrapper
export function ultraFastResponse(data: any, cacheKey?: string) {
  if (cacheKey) {
    setCachedData(cacheKey, data);
  }
  
  return NextResponse.json({
    success: true,
    data,
    timestamp: Date.now(),
    cached: !!cacheKey
  }, {
    headers: {
      'Cache-Control': 'public, max-age=1, s-maxage=1',
      'X-Response-Time': 'ultra-fast'
    }
  });
}

// Ultra-fast error response
export function ultraFastError(message: string, status = 500) {
  return NextResponse.json({
    success: false,
    error: message,
    timestamp: Date.now()
  }, { status });
}
