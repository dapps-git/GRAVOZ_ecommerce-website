const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { authenticateUserOrAdmin, optionalUser } = require('../middleware/auth');

router.post  ('/',                      optionalUser,            ctrl.placeOrder);
router.post  ('/razorpay/order',        optionalUser,            ctrl.createRazorpayOrder);
router.post  ('/razorpay/verify',       optionalUser,            ctrl.verifyRazorpayPayment);
router.post  ('/razorpay/webhook',                               ctrl.handleRazorpayWebhook);
router.get   ('/',                      authenticateUserOrAdmin, ctrl.getOrders);
router.get   ('/:id',                   optionalUser,            ctrl.getOrderById);
router.patch ('/:id/status',            authenticateUserOrAdmin, ctrl.updateOrderStatus);

module.exports = router;

