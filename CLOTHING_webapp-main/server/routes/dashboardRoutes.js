const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get common read-only dashboard overview for all staff & owners
// @route   GET /api/dashboard/overview
// @access  Private (developer, owner, inventory_handler, sales_staff)
router.get(
  '/overview',
  protect,
  authorize('developer', 'owner', 'inventory_handler', 'sales_staff'),
  async (req, res) => {
    try {
      const [recentOrders, totalProducts, totalCustomersCount, recentCustomers, staffList, allOrdersSummary] = await Promise.all([
        Order.find({})
          .sort({ createdAt: -1 })
          .select('orderStatus paymentStatus totalPrice shippingDetails createdAt')
          .limit(8)
          .lean(),
        Product.countDocuments({}),
        User.countDocuments({ role: 'customer' }),
        User.find({ role: 'customer' })
          .select('name email phone isVerified createdAt')
          .sort({ createdAt: -1 })
          .limit(15)
          .lean(),
        User.find({ role: { $in: ['developer', 'owner', 'inventory_handler', 'sales_staff'] } })
          .select('name email role createdAt')
          .sort({ createdAt: -1 })
          .lean(),
        Order.find({}).select('orderStatus paymentStatus totalPrice').lean(),
      ]);

      const successfulOrders = allOrdersSummary.filter(
        o => o.orderStatus !== 'Cancelled' && o.paymentStatus !== 'Failed' && o.paymentStatus !== 'Returned'
      );
      const totalRevenue = successfulOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

      res.json({
        totalRevenue,
        totalOrders: allOrdersSummary.length,
        totalProducts,
        totalUsers: totalCustomersCount,
        recentOrders,
        staffList,
        customerList: recentCustomers,
      });
    } catch (error) {
      console.error('Dashboard Overview Error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
  }
);

module.exports = router;
