const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('User already exists with this email', 400));
        }

        // Only allow consumer and provider registration (admin is seeded)
        if (role && !['consumer', 'provider'].includes(role)) {
            return next(new AppError('Invalid role. Must be consumer or provider', 400));
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'consumer',
            phone,
            address,
        });

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new AppError('Invalid email or password', 401));
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(new AppError('Invalid email or password', 401));
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate(
            'servicesOffered',
            'name category price'
        );

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'phone', 'address', 'avatar'];
        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['consumer', 'provider'])
        .withMessage('Role must be consumer or provider'),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
    try {
        const { credential, role } = req.body;

        if (!credential) {
            return next(new AppError('Google credential is required', 400));
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user from Google data
            user = await User.create({
                name,
                email,
                password: `google_${googleId}_${Date.now()}`,
                role: role && ['consumer', 'provider'].includes(role) ? role : 'consumer',
                avatar: picture || '',
                isVerified: true,
            });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token,
            },
        });
    } catch (error) {
        if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
            return next(new AppError('Invalid Google token. Please try again.', 401));
        }
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    googleAuth,
    registerValidation,
    loginValidation,
};
