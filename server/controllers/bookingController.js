const { body } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { calculateCommission } = require('../utils/commission');
const { sendBookingNotification, sendBookingConfirmation, sendOTPEmail, getWhatsAppOTPLink } = require('../utils/email');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Consumer
const createBooking = async (req, res, next) => {
    try {
        const { services, paymentMethod, address, scheduledDate, notes } = req.body;

        if (!services || services.length === 0) {
            return next(new AppError('At least one service is required', 400));
        }

        // Calculate total amount and validate services
        let totalAmount = 0;
        const bookingServices = [];

        for (const item of services) {
            const service = await Service.findById(item.service);
            if (!service) {
                return next(
                    new AppError(`Service ${item.service} not found`, 404)
                );
            }
            if (!service.isActive) {
                return next(
                    new AppError(`Service "${service.name}" is currently unavailable`, 400)
                );
            }

            const quantity = item.quantity || 1;
            const price = service.price * quantity;
            totalAmount += price;

            bookingServices.push({
                service: service._id,
                quantity,
                price,
            });
        }

        const commission = calculateCommission(totalAmount);

        // Auto-assign provider from the first service
        const firstService = await Service.findById(services[0].service).populate('provider', 'name email phone');
        const providerId = firstService?.provider?._id;

        const booking = await Booking.create({
            consumer: req.user._id,
            provider: providerId || undefined,
            services: bookingServices,
            totalAmount,
            commission,
            paymentMethod,
            address,
            scheduledDate,
            notes,
            status: providerId ? 'assigned' : 'booked',
            paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('consumer', 'name email phone')
            .populate('provider', 'name email phone')
            .populate('services.service', 'name category price');

        // Send booking confirmation email to consumer (async, non-blocking)
        sendBookingConfirmation({
            consumerEmail: req.user.email || populatedBooking.consumer?.email,
            consumerName: req.user.name || populatedBooking.consumer?.name,
            booking: populatedBooking,
        });

        // Send booking notification email to provider (async, non-blocking)
        if (firstService?.provider) {
            sendBookingNotification({
                providerEmail: firstService.provider.email,
                providerName: firstService.provider.name,
                booking: populatedBooking,
            });
        }

        res.status(201).json({
            success: true,
            data: populatedBooking,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all bookings (role-aware)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        // Role-based filtering
        if (req.user.role === 'consumer') {
            query.consumer = req.user._id;
        } else if (req.user.role === 'provider') {
            query.provider = req.user._id;
        }
        // Admin sees all bookings

        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate('consumer', 'name email phone')
                .populate('provider', 'name email phone averageRating')
                .populate('services.service', 'name category price duration')
                .sort('-createdAt')
                .skip(skip)
                .limit(Number(limit)),
            Booking.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('consumer', 'name email phone address')
            .populate('provider', 'name email phone averageRating avatar')
            .populate('services.service', 'name category price duration image');

        if (!booking) {
            return next(new AppError('Booking not found', 404));
        }

        // Check access
        const isConsumer =
            booking.consumer._id.toString() === req.user._id.toString();
        const isProvider =
            booking.provider &&
            booking.provider._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isConsumer && !isProvider && !isAdmin) {
            return next(new AppError('Not authorized to view this booking', 403));
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Provider / Admin
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new AppError('Booking not found', 404));
        }

        // Define valid status transitions
        const validTransitions = {
            booked: ['assigned', 'cancelled'],
            assigned: ['on-the-way', 'cancelled'],
            'on-the-way': ['arrived', 'cancelled'],
            arrived: ['in-progress', 'cancelled'],
            'in-progress': ['cancelled'], // 'completed' requires OTP verification
            completed: ['reviewed'],
        };

        const currentStatus = booking.status;

        if (
            !validTransitions[currentStatus] ||
            !validTransitions[currentStatus].includes(status)
        ) {
            // Special message for trying to complete without OTP
            if (currentStatus === 'in-progress' && status === 'completed') {
                return next(
                    new AppError('Service completion requires OTP verification. Use the verify-otp endpoint.', 400)
                );
            }
            return next(
                new AppError(
                    `Cannot transition from '${currentStatus}' to '${status}'`,
                    400
                )
            );
        }

        booking.status = status;

        // Generate OTP when status moves to "in-progress"
        let otpData = null;
        if (status === 'in-progress') {
            const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
            booking.completionOTP = otp;
            booking.otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

            // Populate consumer details for email
            const populatedBooking = await Booking.findById(booking._id)
                .populate('consumer', 'name email phone')
                .populate('services.service', 'name category price');

            const consumer = populatedBooking.consumer;

            // Send OTP via email
            sendOTPEmail({
                consumerEmail: consumer.email,
                consumerName: consumer.name,
                consumerPhone: consumer.phone,
                otp,
                booking: populatedBooking,
            });

            // Generate WhatsApp link
            const whatsappLink = getWhatsAppOTPLink(
                consumer.phone,
                otp,
                booking._id.toString().slice(-8).toUpperCase()
            );

            otpData = { whatsappLink, message: 'OTP sent to customer via email. Share OTP with customer for service completion.' };
        }

        // Mark payment as paid upon completion for cash payments
        if (status === 'completed' && booking.paymentMethod === 'cash') {
            booking.paymentStatus = 'paid';
        }

        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('consumer', 'name email phone')
            .populate('provider', 'name email phone')
            .populate('services.service', 'name category price');

        res.json({
            success: true,
            data: updatedBooking,
            otp: otpData,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP and complete booking
// @route   PUT /api/bookings/:id/verify-otp
// @access  Provider
const verifyOTPAndComplete = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new AppError('Booking not found', 404));
        }

        if (booking.status !== 'in-progress') {
            return next(new AppError('Booking is not in progress', 400));
        }

        if (!booking.completionOTP) {
            return next(new AppError('No OTP generated for this booking', 400));
        }

        // Check expiry
        if (booking.otpExpiry && new Date() > booking.otpExpiry) {
            return next(new AppError('OTP has expired. Please re-send by updating status to in-progress again.', 400));
        }

        // Validate OTP
        if (booking.completionOTP !== otp) {
            return next(new AppError('Invalid OTP. Please check and try again.', 400));
        }

        // OTP matched → mark as completed
        booking.status = 'completed';
        booking.completionOTP = null;
        booking.otpExpiry = null;
        if (booking.paymentMethod === 'cash') {
            booking.paymentStatus = 'paid';
        }

        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('consumer', 'name email phone')
            .populate('provider', 'name email phone')
            .populate('services.service', 'name category price');

        res.json({
            success: true,
            message: '✅ Service completed and verified!',
            data: updatedBooking,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign provider to booking
// @route   PUT /api/bookings/:id/assign
// @access  Admin
const assignProvider = async (req, res, next) => {
    try {
        const { providerId } = req.body;

        if (!providerId) {
            return next(new AppError('Provider ID is required', 400));
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return next(new AppError('Booking not found', 404));
        }

        if (booking.status !== 'booked') {
            return next(
                new AppError('Can only assign provider to a booked booking', 400)
            );
        }

        // Verify provider exists and is a provider
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'provider') {
            return next(new AppError('Invalid provider', 400));
        }

        booking.provider = providerId;
        booking.status = 'assigned';
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('consumer', 'name email phone')
            .populate('provider', 'name email phone averageRating')
            .populate('services.service', 'name category price');

        // Send email notification to provider about the new booking
        sendBookingNotification({
            providerEmail: provider.email,
            providerName: provider.name,
            booking: updatedBooking,
        });

        res.json({
            success: true,
            data: updatedBooking,
        });
    } catch (error) {
        next(error);
    }
};

// Validation rules
const createBookingValidation = [
    body('services')
        .isArray({ min: 1 })
        .withMessage('At least one service is required'),
    body('services.*.service')
        .notEmpty()
        .withMessage('Service ID is required'),
    body('paymentMethod')
        .isIn(['card', 'upi', 'cash'])
        .withMessage('Payment method must be card, upi, or cash'),
    body('address.street').notEmpty().withMessage('Street address is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.zip').notEmpty().withMessage('ZIP code is required'),
    body('scheduledDate')
        .isISO8601()
        .withMessage('Valid scheduled date is required'),
];

module.exports = {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    verifyOTPAndComplete,
    assignProvider,
    createBookingValidation,
};
