const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { cache } = require('../middleware/cache');
const {
    createService,
    getServices,
    getService,
    updateService,
    deleteService,
    getCategoryCounts,
    createServiceValidation,
} = require('../controllers/serviceController');

// Category counts — cached for 10 minutes
router.get('/category-counts', cache(600), getCategoryCounts);

router
    .route('/')
    .post(
        protect,
        authorize('provider'),
        createServiceValidation,
        validate,
        createService
    )
    .get(cache(300), getServices); // Service listings — cached for 5 minutes

router
    .route('/:id')
    .get(getService)
    .put(protect, authorize('provider'), updateService)
    .delete(protect, authorize('provider', 'admin'), deleteService);

module.exports = router;
