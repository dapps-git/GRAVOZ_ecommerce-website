const router = require('express').Router();
const ctrl   = require('../controllers/orderController');

router.post  ('/',                      ctrl.placeOrder);
router.post  ('/razorpay/order',        ctrl.createRazorpayOrder);
router.post  ('/razorpay/verify',       ctrl.verifyRazorpayPayment);
router.get   ('/',                      ctrl.getOrders);
router.get   ('/:id',                   ctrl.getOrderById);
router.patch ('/:id/status',            ctrl.updateOrderStatus);

module.exports = router;

