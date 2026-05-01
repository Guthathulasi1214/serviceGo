const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    register,
    login,
    getMe,
    updateProfile,
    googleAuth,
    registerValidation,
    loginValidation,
} = require('../controllers/authController');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

module.exports = router;
