

const { getRedisClient } = require('../config/redis');

/**
 * Creates a caching middleware with the given TTL
 * @param {number} ttl - Time to live in seconds (default: 300)
 */
const cache = (ttl = 300) => {
    return async (req, res, next) => {
        const client = getRedisClient();

        if (!client) {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cached = await client.get(key);

            if (cached) {
                const parsed = JSON.parse(cached);
                return res.json(parsed);
            }

            const originalJson = res.json.bind(res);

            res.json = (data) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    client.setex(key, ttl, JSON.stringify(data)).catch((err) => {
                        console.error(`Cache write error: ${err.message}`);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (err) {
            console.error(`Cache middleware error: ${err.message}`);
            next(); // Fail open — serve uncached
        }
    };
};

/**
 * Invalidate cache entries matching a pattern
 * @param {string} pattern 
 */
const invalidateCache = async (pattern) => {
    const client = getRedisClient();
    if (!client) return;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
            console.log(`🗑️  Cache invalidated: ${keys.length} key(s) matching "${pattern}"`);
        }
    } catch (err) {
        console.error(`Cache invalidation error: ${err.message}`);
    }
};

module.exports = { cache, invalidateCache };
