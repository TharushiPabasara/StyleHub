const Notification = require('../models/Notification');

/**
 * Checks if a variant's stock has fallen below its threshold (default 2)
 * and dispatches in-app notification for the admin dashboard.
 * 
 * @param {Object} product - Product document or object
 * @param {Object} variant - Variant object
 * @param {Number|null} previousStock - Stock before reduction
 */
const checkAndNotifyLowStock = async (product, variant, previousStock = null) => {
  try {
    // If product is deactivated or discontinued, do not trigger low stock notifications
    if (product.isActive === false) {
      return;
    }

    const threshold = typeof variant.threshold === 'number' ? variant.threshold : 2;
    const currentStock = Number(variant.stock) || 0;

    // Trigger notification when quantity falls below threshold
    if (currentStock < threshold) {
      const variantDesc = `Size ${variant.size}`;
      const title = `Low Stock Alert: ${product.name}`;
      const message = `${product.name} (${variantDesc}) has fallen below the threshold (${threshold}). Current remaining quantity: ${currentStock}.`;

      // Check if an unread notification for this product & variant already exists
      let existingNotification = await Notification.findOne({
        product: product._id,
        'variant.size': variant.size,
        isRead: false,
      });

      if (existingNotification) {
        existingNotification.message = message;
        existingNotification.variant.stock = currentStock;
        existingNotification.variant.threshold = threshold;
        await existingNotification.save();
      } else {
        await Notification.create({
          type: 'LOW_STOCK',
          title,
          message,
          product: product._id,
          productName: product.name,
          variant: {
            size: variant.size,
            stock: currentStock,
            threshold,
          },
          isRead: false,
        });
      }

      console.log(`[LOW STOCK ALERT] ${product.name} (${variantDesc}): Stock=${currentStock}, Threshold=${threshold}`);
    }
  } catch (err) {
    console.error('checkAndNotifyLowStock error:', err);
  }
};

module.exports = {
  checkAndNotifyLowStock,
};
