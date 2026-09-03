const router = require('express').Router();
const ctrl   = require('../controllers/reviewController');

router.get ('/', ctrl.getReviews);
router.post('/', ctrl.submitReview);

module.exports = router;
