const router = require('express').Router();
const ctrl   = require('../controllers/reviewController');
const { optionalUser } = require('../middleware/auth');

router.get ('/', ctrl.getReviews);
router.post('/', optionalUser, ctrl.submitReview);

module.exports = router;
