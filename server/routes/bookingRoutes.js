const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    verifyOTPAndComplete,
    assignProvider,
    createBookingValidation,
} = require('../controllers/bookingController');

router
    .route('/')
    .post(
        protect,
        authorize('consumer'),
        createBookingValidation,
        validate,
        createBooking
    )
    .get(protect, getBookings);

router.route('/:id').get(protect, getBooking);

router.put(
    '/:id/status',
    protect,
    authorize('provider', 'admin'),
    updateBookingStatus
);

router.put('/:id/verify-otp', protect, authorize('provider'), verifyOTPAndComplete);

router.put('/:id/assign', protect, authorize('admin'), assignProvider);

module.exports = router;
