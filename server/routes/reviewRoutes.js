const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
    createReview,
    getProviderReviews,
    createReviewValidation,
} = require('../controllers/reviewController');

router.post(
    '/',
    protect,
    authorize('consumer'),
    createReviewValidation,
    validate,
    createReview
);

router.get('/provider/:providerId', getProviderReviews);

module.exports = router;
