const router = require('express').Router();
const ctrl   = require('../controllers/couponController');

router.post('/validate', ctrl.validateCoupon);

module.exports = router;
