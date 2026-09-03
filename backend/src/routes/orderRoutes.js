const router = require('express').Router();
const ctrl   = require('../controllers/orderController');

router.post  ('/',               ctrl.placeOrder);
router.get   ('/',               ctrl.getOrders);
router.get   ('/:id',            ctrl.getOrderById);
router.patch ('/:id/status',     ctrl.updateOrderStatus);

module.exports = router;
