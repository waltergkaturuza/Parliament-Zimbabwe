// Simple data cache for static resources to reduce API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class DataCache {
  private cache: Map<string, CacheEntry> = new Map();

  // Cache data with TTL (default 5 minutes)
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached data if not expired
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Clear specific cache entry
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Cache keys for different data types
export const CACHE_KEYS = {
  SUB_CENTERS: 'sub_centers',
  BOXES: 'boxes',
  AVAILABLE_BOOKS: 'available_books',
  DISPATCH_LIST: 'dispatch_list',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  STATIC_DATA: 10 * 60 * 1000,     // 10 minutes for static data
  DYNAMIC_DATA: 2 * 60 * 1000,      // 2 minutes for dynamic data
  USER_SESSION: 30 * 60 * 1000,     // 30 minutes for user session data
} as const;