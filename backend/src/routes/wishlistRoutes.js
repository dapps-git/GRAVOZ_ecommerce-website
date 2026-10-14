const router = require('express').Router();
const ctrl   = require('../controllers/wishlistController');
const { optionalUser } = require('../middleware/auth');

router.use(optionalUser);

router.get   ('/', ctrl.getWishlist);
router.post  ('/', ctrl.toggleWishlist);
router.delete('/', ctrl.deleteFromWishlist);

module.exports = router;
