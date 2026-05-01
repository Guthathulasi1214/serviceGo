const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const { sendServiceApprovalEmail } = require('../utils/email');

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalProviders,
            totalConsumers,
            totalServices,
            approvedServices,
            pendingServices,
            totalBookings,
            bookingsByStatus,
            totalRevenue,
            totalCommission,
            recentBookings,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'provider' }),
            User.countDocuments({ role: 'consumer' }),
            Service.countDocuments(),
            Service.countDocuments({ isApproved: true }),
            Service.countDocuments({ isApproved: false }),
            Booking.countDocuments(),
            Booking.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$commission' } } },
            ]),
            Booking.find()
                .populate('consumer', 'name email')
                .populate('provider', 'name email')
                .populate('services.service', 'name category price')
                .sort('-createdAt')
                .limit(10),
        ]);

        const statusMap = {};
        bookingsByStatus.forEach((item) => {
            statusMap[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                users: { total: totalUsers, providers: totalProviders, consumers: totalConsumers },
                services: { total: totalServices, approved: approvedServices, pending: pendingServices },
                bookings: { total: totalBookings, byStatus: statusMap },
                revenue: { total: totalRevenue[0]?.total || 0, commission: totalCommission[0]?.total || 0 },
                recentBookings,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        const query = {};
        if (role) query.role = role;

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(query).select('-password').sort('-createdAt').skip(skip).limit(Number(limit)),
            User.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: users,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify a provider
// @route   PUT /api/admin/users/:id/verify
// @access  Admin
const verifyProvider = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return next(new AppError('User not found', 404));
        if (user.role !== 'provider') return next(new AppError('User is not a provider', 400));

        user.isVerified = true;
        await user.save();

        res.json({ success: true, message: `Provider ${user.name} has been verified`, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all services for admin (including unapproved)
// @route   GET /api/admin/services
// @access  Admin
const getAllServices = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status === 'pending') query.isApproved = false;
        if (status === 'approved') query.isApproved = true;

        const skip = (Number(page) - 1) * Number(limit);
        const [services, total] = await Promise.all([
            Service.find(query)
                .populate('provider', 'name email phone isVerified')
                .sort('-createdAt')
                .skip(skip)
                .limit(Number(limit)),
            Service.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: services,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve a service
// @route   PUT /api/admin/services/:id/approve
// @access  Admin
const approveService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id).populate('provider', 'name email');
        if (!service) return next(new AppError('Service not found', 404));

        service.isApproved = true;
        await service.save();

        // Send approval email to provider
        if (service.provider?.email) {
            sendServiceApprovalEmail({
                providerEmail: service.provider.email,
                providerName: service.provider.name,
                service: service,
            });
        }

        res.json({
            success: true,
            message: `Service "${service.name}" has been approved`,
            data: service,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject/delete a service
// @route   DELETE /api/admin/services/:id/reject
// @access  Admin
const rejectService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return next(new AppError('Service not found', 404));

        await Service.findByIdAndDelete(req.params.id);

        // Remove from provider's servicesOffered
        await User.findByIdAndUpdate(service.provider, {
            $pull: { servicesOffered: service._id },
        });

        res.json({ success: true, message: `Service rejected and removed` });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all bookings for admin
// @route   GET /api/admin/bookings
// @access  Admin
const getAllBookings = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate('consumer', 'name email phone')
                .populate('provider', 'name email phone')
                .populate('services.service', 'name category price')
                .sort('-createdAt')
                .skip(skip)
                .limit(Number(limit)),
            Booking.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm cash/QR payment (mark as paid)
// @route   PUT /api/admin/bookings/:id/confirm-payment
// @access  Admin OR Provider
const confirmPayment = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return next(new AppError('Booking not found', 404));

        booking.paymentStatus = 'paid';
        await booking.save();

        res.json({ success: true, message: 'Payment confirmed', data: booking });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getAllUsers,
    verifyProvider,
    getAllServices,
    approveService,
    rejectService,
    getAllBookings,
    confirmPayment,
};
