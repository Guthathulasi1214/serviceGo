const { body } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');

// @desc    Create a review for a completed booking
// @route   POST /api/reviews
// @access  Consumer
const createReview = async (req, res, next) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // Verify booking exists and is completed
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return next(new AppError('Booking not found', 404));
        }

        if (booking.consumer.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to review this booking', 403));
        }

        if (booking.status !== 'completed') {
            return next(
                new AppError('Can only review completed bookings', 400)
            );
        }

        if (!booking.provider) {
            return next(new AppError('No provider assigned to this booking', 400));
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return next(new AppError('Booking already reviewed', 400));
        }

        const review = await Review.create({
            booking: bookingId,
            consumer: req.user._id,
            provider: booking.provider,
            rating,
            comment,
        });

        // Update booking status to reviewed
        booking.status = 'reviewed';
        await booking.save();

        const populatedReview = await Review.findById(review._id)
            .populate('consumer', 'name avatar')
            .populate('provider', 'name');

        res.status(201).json({
            success: true,
            data: populatedReview,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
const getProviderReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [reviews, total] = await Promise.all([
            Review.find({ provider: req.params.providerId })
                .populate('consumer', 'name avatar')
                .populate('booking', 'services scheduledDate')
                .sort('-createdAt')
                .skip(skip)
                .limit(Number(limit)),
            Review.countDocuments({ provider: req.params.providerId }),
        ]);

        res.json({
            success: true,
            data: reviews,
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

// Validation rules
const createReviewValidation = [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
];

module.exports = {
    createReview,
    getProviderReviews,
    createReviewValidation,
};
