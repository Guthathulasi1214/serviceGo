const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true,
        },
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            maxlength: 500,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// After saving a review, update the provider's averageRating and completedJobs
reviewSchema.post('save', async function () {
    const Review = this.constructor;
    const User = mongoose.model('User');

    // Calculate new average rating for the provider
    const stats = await Review.aggregate([
        { $match: { provider: this.provider } },
        {
            $group: {
                _id: '$provider',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        await User.findByIdAndUpdate(this.provider, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            completedJobs: stats[0].totalReviews,
        });
    }
});

// If a review is deleted, recalculate the provider's stats
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const Review = mongoose.model('Review');
        const User = mongoose.model('User');

        const stats = await Review.aggregate([
            { $match: { provider: doc.provider } },
            {
                $group: {
                    _id: '$provider',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await User.findByIdAndUpdate(doc.provider, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                completedJobs: stats[0].totalReviews,
            });
        } else {
            await User.findByIdAndUpdate(doc.provider, {
                averageRating: 0,
                completedJobs: 0,
            });
        }
    }
});

module.exports = mongoose.model('Review', reviewSchema);
