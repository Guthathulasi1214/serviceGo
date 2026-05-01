const { body } = require('express-validator');
const Service = require('../models/Service');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendNewServiceToAdminEmail } = require('../utils/email');
const { invalidateCache } = require('../middleware/cache');

// @desc    Create a service
// @route   POST /api/services
// @access  Provider
const createService = async (req, res, next) => {
    try {
        const { name, category, description, price, duration, image } = req.body;

        const service = await Service.create({
            name,
            category,
            description,
            price,
            duration,
            image,
            provider: req.user._id,
        });

        // Add service to provider's servicesOffered
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { servicesOffered: service._id },
        });

        // Notify all admin users via email
        const admins = await User.find({ role: 'admin' }, 'email');
        if (admins.length > 0) {
            sendNewServiceToAdminEmail({
                adminEmails: admins.map(a => a.email),
                providerName: req.user.name,
                service,
            });
        }

        // Invalidate cached service listings
        await invalidateCache('cache:/api/services*');

        res.status(201).json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all services (with filtering, search, pagination)
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
            sort = '-createdAt',
        } = req.query;

        const query = { isActive: true, isApproved: true };

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [services, total] = await Promise.all([
            Service.find(query)
                .populate('provider', 'name averageRating completedJobs isVerified')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            Service.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: services,
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

// @desc    Get category service counts
// @route   GET /api/services/category-counts
// @access  Public
const getCategoryCounts = async (req, res, next) => {
    try {
        const counts = await Service.aggregate([
            { $match: { isActive: true, isApproved: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);
        const result = {};
        counts.forEach(c => { result[c._id] = c.count; });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id).populate(
            'provider',
            'name email phone averageRating completedJobs isVerified avatar'
        );

        if (!service) {
            return next(new AppError('Service not found', 404));
        }

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Provider (owner)
const updateService = async (req, res, next) => {
    try {
        let service = await Service.findById(req.params.id);

        if (!service) {
            return next(new AppError('Service not found', 404));
        }

        // Check ownership
        if (service.provider.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to update this service', 403));
        }

        const allowedFields = [
            'name',
            'category',
            'description',
            'price',
            'duration',
            'image',
            'isActive',
        ];
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        service = await Service.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        // Invalidate cached service listings
        await invalidateCache('cache:/api/services*');

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Provider (owner) / Admin
const deleteService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return next(new AppError('Service not found', 404));
        }

        // Check ownership or admin
        if (
            service.provider.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return next(new AppError('Not authorized to delete this service', 403));
        }

        // Remove from provider's servicesOffered
        await User.findByIdAndUpdate(service.provider, {
            $pull: { servicesOffered: service._id },
        });

        await Service.findByIdAndDelete(req.params.id);

        // Invalidate cached service listings
        await invalidateCache('cache:/api/services*');

        res.json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Validation rules
const createServiceValidation = [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('category')
        .isIn([
            'plumbing',
            'cleaning',
            'electrical',
            'beauty',
            'painting',
            'carpentry',
            'pest-control',
            'appliance-repair',
            'other',
        ])
        .withMessage('Valid category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('duration')
        .optional()
        .isInt({ min: 15 })
        .withMessage('Duration must be at least 15 minutes'),
];

module.exports = {
    createService,
    getServices,
    getService,
    updateService,
    deleteService,
    getCategoryCounts,
    createServiceValidation,
};
