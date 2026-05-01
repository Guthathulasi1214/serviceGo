const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./socket');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Connect to Redis (optional — app works without it)
connectRedis();

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(helmet());

// CORS — configurable via env
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Logging — Morgan in dev, custom logger always
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}
app.use(logger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/providers', require('./routes/providerRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ServiceGo API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
    });
});

// ── Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── HTTP + Socket.io Server ────────────────────────────
const server = http.createServer(app);
initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ── Graceful Shutdown ──────────────────────────────────
const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

    server.close(() => {
        console.log('✅ HTTP server closed');

        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
            console.log('✅ MongoDB connection closed');

            const { getRedisClient } = require('./config/redis');
            const redis = getRedisClient();
            if (redis) {
                redis.quit().then(() => {
                    console.log('✅ Redis connection closed');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

module.exports = { app, server };
