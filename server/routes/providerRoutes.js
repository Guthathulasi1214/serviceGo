const router = require('express').Router();
const { getRankedProviders } = require('../controllers/providerController');

router.get('/ranked', getRankedProviders);

module.exports = router;
