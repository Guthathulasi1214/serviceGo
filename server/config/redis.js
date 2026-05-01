/**
 * Redis Client Configuration
 *
 * Provides a Redis connection for caching.
 * Gracefully degrades — the app works without Redis.
 * If Redis is unavailable, caching is simply skipped.
 */

const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('REDIS_URL not set — caching disabled');
        return null;
    }

    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 1000,
            lazyConnect: true,
            
            retryStrategy(times) {
                if (times > 10) {
                    console.error('Redis: Max reconnection attempts reached');
                    return null; 
                }
                return Math.min(times * 200, 10000);
            },
        });

        redisClient.on('connect', () => {
            console.log('Redis connected');
        });

        redisClient.on('ready', () => {
            console.log('Redis ready');
        });

        redisClient.on('error', (err) => {
            console.error(` Redis error: ${err.message}`);
        });

        redisClient.on('close', () => {
            console.warn('  Redis connection closed');
        });

        redisClient.connect().catch((err) => {
            console.warn(` Redis connection failed: ${err.message} — caching disabled`);
            redisClient = null;
        });

        return redisClient;
    } catch (err) {
        console.warn(`Redis setup failed: ${err.message} — caching disabled`);
        return null;
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
