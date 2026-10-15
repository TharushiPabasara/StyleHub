const Notification = require('../models/Notification');
const Product = require('../models/Product');
const { checkAndNotifyLowStock } = require('../utils/stockNotification');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'inventory_handler') {
      filter = { type: { $ne: 'ORDER_CREATED' } };
    } else if (req.user.role === 'sales_staff') {
      filter = { type: 'ORDER_CREATED' };
    }

    const notifications = await Notification.find(filter)
      .populate('product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private/Admin
const getUnreadCount = async (req, res) => {
  try {
    let filter = { isRead: false };
    if (req.user.role === 'inventory_handler') {
      filter.type = { $ne: 'ORDER_CREATED' };
    } else if (req.user.role === 'sales_staff') {
      filter.type = 'ORDER_CREATED';
    }

    const count = await Notification.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unread count', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private/Admin
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await Notification.deleteOne({ _id: notification._id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

// @desc    Scan all products and generate notifications for low stock variants
// @route   POST /api/notifications/scan-low-stock
// @access  Private/Admin
const scanLowStock = async (req, res) => {
  try {
    const products = await Product.find({});
    let lowStockCount = 0;

    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const threshold = typeof variant.threshold === 'number' ? variant.threshold : 2;
          if (variant.stock < threshold) {
            await checkAndNotifyLowStock(product, variant);
            lowStockCount++;
          }
        }
      }
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.json({ 
      message: `Scan complete. Found ${lowStockCount} low stock variant(s).`,
      lowStockCount,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to scan inventory', error: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  scanLowStock,
};
