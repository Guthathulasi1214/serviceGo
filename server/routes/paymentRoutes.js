const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    createStripePayment,
    createRazorpayOrder,
    verifyRazorpayPayment,
    generateQRCode,
    confirmCashPayment,
} = require('../controllers/paymentController');

router.post('/stripe', protect, createStripePayment);
router.post('/razorpay', protect, createRazorpayOrder);
router.post('/verify/razorpay', protect, verifyRazorpayPayment);
router.post('/qr', protect, generateQRCode);
router.put('/confirm', protect, authorize('provider', 'admin'), confirmCashPayment);

module.exports = router;
