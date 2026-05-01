const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    getStats,
    getAllUsers,
    verifyProvider,
    getAllServices,
    approveService,
    rejectService,
    getAllBookings,
    confirmPayment,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/verify', verifyProvider);
router.get('/services', getAllServices);
router.put('/services/:id/approve', approveService);
router.delete('/services/:id/reject', rejectService);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/confirm-payment', confirmPayment);

module.exports = router;
