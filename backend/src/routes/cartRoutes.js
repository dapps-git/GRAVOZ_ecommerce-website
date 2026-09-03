const router = require('express').Router();
const ctrl   = require('../controllers/cartController');

router.get   ('/', ctrl.getCart);
router.post  ('/', ctrl.addToCart);
router.put   ('/', ctrl.updateCart);
router.delete('/', ctrl.deleteFromCart);

module.exports = router;
