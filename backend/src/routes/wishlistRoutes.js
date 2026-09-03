const router = require('express').Router();
const ctrl   = require('../controllers/wishlistController');

router.get   ('/', ctrl.getWishlist);
router.post  ('/', ctrl.toggleWishlist);
router.delete('/', ctrl.deleteFromWishlist);

module.exports = router;
