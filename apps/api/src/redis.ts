import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

export const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('error', (err: Error) => {
  console.error('[redis] connection error:', err.message);
});
