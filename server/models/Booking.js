const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        services: [
            {
                service: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Service',
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commission: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: [
                'booked',
                'assigned',
                'on-the-way',
                'arrived',
                'in-progress',
                'completed',
                'reviewed',
                'cancelled',
            ],
            default: 'booked',
        },
        paymentMethod: {
            type: String,
            enum: ['card', 'upi', 'cash'],
            required: [true, 'Payment method is required'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentId: {
            type: String,
            default: '',
        },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zip: { type: String, required: true },
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Scheduled date is required'],
        },
        notes: {
            type: String,
            maxlength: 500,
        },
        completionOTP: {
            type: String,
            default: null,
        },
        otpExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
bookingSchema.index({ consumer: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
