const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
            maxlength: 100,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'cleaning',
                'plumbing',
                'electrical',
                'beauty',
                'painting',
                'carpentry',
                'pest-control',
                'appliance-repair',
                'home-repair',
                'cooking',
                'domestic-help',
                'moving',
                'laundry',
                'outdoor',
                'event',
                'security',
                'pet-services',
                'other',
            ],
        },
        description: {
            type: String,
            maxlength: 500,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        duration: {
            type: Number,
            default: 60,
            min: 15,
        },
        image: {
            type: String,
            default: '',
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for search and filtering
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
