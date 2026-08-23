class MemoryCache {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | undefined;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const had = this.store.has(key);
    this.store.delete(key);
    return had ? 1 : 0;
  }
}

const memoryCache = new MemoryCache();

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await memoryCache.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    await memoryCache.set(key, serialized, 'EX', ttlSeconds);
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await memoryCache.del(key);
  } catch (err) {
    console.error('Cache invalidate error:', err);
  }
}
