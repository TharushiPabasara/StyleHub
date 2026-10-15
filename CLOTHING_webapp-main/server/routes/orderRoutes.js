const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(createOrder)
  .get(protect, authorize('developer', 'owner', 'sales_staff'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/status')
  .put(protect, authorize('developer', 'owner', 'sales_staff'), updateOrderStatus);

module.exports = router;
