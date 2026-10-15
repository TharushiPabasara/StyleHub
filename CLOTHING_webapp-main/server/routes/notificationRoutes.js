const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  scanLowStock,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All notification routes are protected for authorized roles
router.use(protect);
router.use(authorize('developer', 'owner', 'inventory_handler', 'sales_staff'));

router.route('/')
  .get(getNotifications);

router.route('/unread-count')
  .get(getUnreadCount);

router.route('/mark-all-read')
  .put(markAllAsRead);

router.route('/scan-low-stock')
  .post(scanLowStock);

router.route('/:id/read')
  .put(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
