const User = require('../models/User');
const Service = require('../models/Service');

// @desc    Get ranked providers by category
// @route   GET /api/providers/ranked
// @access  Public
const getRankedProviders = async (req, res, next) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        // Build service query
        const serviceQuery = { isActive: true };
        if (category) {
            serviceQuery.category = category;
        }

        // Find services in the category
        const services = await Service.find(serviceQuery).distinct('provider');

        // Get providers who offer these services, ranked
        const skip = (Number(page) - 1) * Number(limit);

        const [providers, total] = await Promise.all([
            User.find({
                _id: { $in: services },
                role: 'provider',
            })
                .select('name email phone avatar averageRating completedJobs isVerified')
                .sort({
                    isVerified: -1,
                    averageRating: -1,
                    completedJobs: -1,
                })
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments({
                _id: { $in: services },
                role: 'provider',
            }),
        ]);

        // Attach services for each provider
        const providersWithServices = await Promise.all(
            providers.map(async (provider) => {
                const providerServices = await Service.find({
                    provider: provider._id,
                    isActive: true,
                    ...(category && { category }),
                }).select('name category price duration');

                return {
                    ...provider.toObject(),
                    services: providerServices,
                };
            })
        );

        res.json({
            success: true,
            data: providersWithServices,
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

module.exports = { getRankedProviders };
