// Redis connection helper with graceful error handling
import Redis from 'ioredis';

let redisWarningShown = false;

/**
 * Create a Redis client that suppresses all errors
 * Returns a client that fails silently when Redis is unavailable
 */
export function createSilentRedis(url?: string): Redis {
  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't retry
    lazyConnect: true,
    enableReadyCheck: false,
    showFriendlyErrorStack: false,
    enableOfflineQueue: false,
  });

  // Suppress all error events to prevent spam
  client.on('error', (err) => {
    if (!redisWarningShown) {
      console.warn('⚠️  Redis not available. Caching disabled.');
      redisWarningShown = true;
    }
    // Silently ignore all subsequent errors
  });

  // Try to connect but ignore failures
  client.connect().catch(() => {
    // Ignore connection failures
  });

  return client;
}

let redisClient: Redis | null = null;

/**
 * Get shared Redis client instance
 * Returns null if Redis is not available
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createSilentRedis();
  }
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Safe Redis operations with fallback
 */
export async function redisGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return null;

  try {
    return await client.get(key);
  } catch (error) {
    return null;
  }
}

export async function redisSet(
  key: string,
  value: string,
  ttl?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return false;

  try {
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    return false;
  }
}
