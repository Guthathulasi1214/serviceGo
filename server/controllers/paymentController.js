const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const QRCode = require('qrcode');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe
// @access  Private
const createStripePayment = async (req, res, next) => {
    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return next(new AppError('Booking not found', 404));
        if (booking.consumer.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
        if (booking.paymentStatus === 'paid') return next(new AppError('Booking already paid', 400));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(booking.totalAmount * 100),
            currency: 'inr',
            metadata: { bookingId: booking._id.toString(), consumerId: req.user._id.toString() },
        });

        booking.paymentId = paymentIntent.id;
        await booking.save();

        res.json({
            success: true,
            data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: booking.totalAmount },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create Razorpay order
// @route   POST /api/payments/razorpay
// @access  Private
const createRazorpayOrder = async (req, res, next) => {
    try {
        const Razorpay = require('razorpay');
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return next(new AppError('Booking not found', 404));
        if (booking.consumer.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
        if (booking.paymentStatus === 'paid') return next(new AppError('Booking already paid', 400));

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
            amount: Math.round(booking.totalAmount * 100),
            currency: 'INR',
            receipt: `booking_${booking._id}`,
            notes: { bookingId: booking._id.toString(), consumerId: req.user._id.toString() },
        });

        booking.paymentId = order.id;
        await booking.save();

        res.json({
            success: true,
            data: { orderId: order.id, amount: booking.totalAmount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify/razorpay
// @access  Private
const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const crypto = require('crypto');
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return next(new AppError('Payment verification failed', 400));
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) return next(new AppError('Booking not found', 404));

        booking.paymentStatus = 'paid';
        booking.paymentId = razorpay_payment_id;
        await booking.save();

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: { bookingId: booking._id, paymentId: razorpay_payment_id, paymentStatus: 'paid' },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate UPI QR code for cash/UPI on delivery
// @route   POST /api/payments/qr
// @access  Private
const generateQRCode = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('provider', 'name email phone');
        if (!booking) return next(new AppError('Booking not found', 404));
        if (booking.paymentStatus === 'paid') return next(new AppError('Already paid', 400));

        // Generate UPI payment string
        const upiId = process.env.UPI_ID || 'servicego@upi';
        const amount = booking.totalAmount;
        const txnNote = `ServiceGo_Booking_${booking._id.toString().slice(-8).toUpperCase()}`;
        const upiString = `upi://pay?pa=${upiId}&pn=ServiceGo&am=${amount}&cu=INR&tn=${txnNote}`;

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(upiString, {
            width: 300,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
        });

        res.json({
            success: true,
            data: {
                qrCode: qrDataUrl,
                upiString,
                amount,
                bookingId: booking._id,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm cash/QR payment
// @route   PUT /api/payments/confirm
// @access  Provider / Admin
const confirmCashPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('consumer', 'name email phone')
            .populate('provider', 'name email phone');
        if (!booking) return next(new AppError('Booking not found', 404));

        booking.paymentStatus = 'paid';
        // Auto-complete the booking when cash payment is confirmed
        if (['in-progress', 'arrived', 'assigned', 'on-the-way', 'booked'].includes(booking.status)) {
            booking.status = 'completed';
        }
        await booking.save();

        res.json({
            success: true,
            message: 'Payment confirmed and booking completed!',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStripePayment,
    createRazorpayOrder,
    verifyRazorpayPayment,
    generateQRCode,
    confirmCashPayment,
};
