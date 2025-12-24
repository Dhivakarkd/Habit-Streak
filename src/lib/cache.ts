/**
 * Simple fetch caching utility with revalidation
 * Memoizes API calls in memory and provides cache invalidation
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Global cache store
const cache = new Map<string, CacheEntry<any>>();
const listeners = new Map<string, Set<() => void>>();

// Default TTL: 5 minutes (can be overridden per call)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get cached data or fetch fresh
 * @param key Unique cache key
 * @param fetcher Function to fetch data
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  // Return cached data if still valid
  if (cached && now - cached.timestamp < ttl) {
    console.log(`[CACHE] HIT: ${key}`);
    return cached.data;
  }

  console.log(`[CACHE] MISS: ${key}`);
  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  return data;
}

/**
 * Revalidate cache by key (invalidate)
 */
export function revalidateCache(key: string): void {
  console.log(`[CACHE] INVALIDATE: ${key}`);
  cache.delete(key);

  // Notify subscribers
  const subs = listeners.get(key);
  if (subs) {
    subs.forEach((cb) => cb());
  }
}

/**
 * Revalidate multiple cache keys by pattern (e.g., "challenges.*" clears all challenge caches)
 */
export function revalidateCacheByPattern(pattern: string): void {
  const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
  const keysToDelete: string[] = [];

  cache.forEach((_, key) => {
    if (regex.test(key)) {
      keysToDelete.push(key);
      console.log(`[CACHE] INVALIDATE: ${key}`);

      // Notify subscribers
      const subs = listeners.get(key);
      if (subs) {
        subs.forEach((cb) => cb());
      }
    }
  });

  keysToDelete.forEach((key) => cache.delete(key));
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  console.log('[CACHE] CLEAR ALL');
  cache.clear();
  listeners.clear();
}

/**
 * Subscribe to cache changes
 */
export function onCacheChange(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.get(key)?.delete(callback);
  };
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
