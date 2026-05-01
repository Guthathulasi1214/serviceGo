const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });

    // Authentication middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userRole})`);

        // ── Join a booking room ─────────────────────────────
        socket.on('booking:join', (bookingId) => {
            socket.join(`booking:${bookingId}`);
            console.log(`User ${socket.userId} joined booking room: ${bookingId}`);
        });

        // ── Leave a booking room ────────────────────────────
        socket.on('booking:leave', (bookingId) => {
            socket.leave(`booking:${bookingId}`);
            console.log(`User ${socket.userId} left booking room: ${bookingId}`);
        });

        // ── Provider sends GPS location update ──────────────
        socket.on('location:update', (data) => {
            const { bookingId, lat, lng } = data;

            if (socket.userRole !== 'provider') {
                return socket.emit('error', { message: 'Only providers can share location' });
            }

            // Broadcast location to the booking room (consumer sees it)
            socket.to(`booking:${bookingId}`).emit('location:updated', {
                providerId: socket.userId,
                lat,
                lng,
                timestamp: new Date(),
            });
        });

        // ── Provider has arrived ────────────────────────────
        socket.on('provider:arrived', (data) => {
            const { bookingId } = data;

            if (socket.userRole !== 'provider') {
                return socket.emit('error', { message: 'Only providers can mark arrival' });
            }

            // Notify the booking room
            io.to(`booking:${bookingId}`).emit('provider:arrived', {
                providerId: socket.userId,
                bookingId,
                message: 'Provider has arrived at your location!',
                timestamp: new Date(),
            });
        });

        // ── Booking status update notification ──────────────
        socket.on('booking:statusUpdate', (data) => {
            const { bookingId, status } = data;

            io.to(`booking:${bookingId}`).emit('booking:statusChanged', {
                bookingId,
                status,
                updatedBy: socket.userId,
                timestamp: new Date(),
            });
        });

        // ── Disconnect ──────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };
