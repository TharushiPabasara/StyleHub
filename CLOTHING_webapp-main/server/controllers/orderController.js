const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const CategoryDiscount = require('../models/CategoryDiscount');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const { checkAndNotifyLowStock } = require('../utils/stockNotification');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingDetails,
      paymentMethod,
      user,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Fetch active category discounts
    const now = new Date();
    const activeDiscounts = await CategoryDiscount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ discountPercentage: -1 });

    // 1. Calculate price from backend and reduce stock
    let calculatedTotalPrice = 0;
    
    // We must process items sequentially to properly check/update stock 
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }

      // Find the specific variant
      const variantIndex = product.variants.findIndex(
        (v) => v.size === item.variant?.size
      );

      if (variantIndex === -1) {
        return res.status(400).json({ message: `Variant not found for ${item.name}` });
      }

      const variant = product.variants[variantIndex];

      if (variant.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name} (${variant.size})` });
      }

      // Check if an active category discount applies to this product
      const applicableDiscount = activeDiscounts.find(d => 
        d.category === 'All' || (product.category && d.category.toLowerCase() === product.category.toLowerCase())
      );

      const effectivePrice = applicableDiscount 
        ? Math.max(0, product.price - Math.round((product.price * applicableDiscount.discountPercentage) / 100))
        : product.price;

      // Calculate price securely with active discount
      calculatedTotalPrice += effectivePrice * item.quantity;
      
      // Update item price securely for the order record
      item.price = effectivePrice;

      // Track previous stock and reduce stock
      const prevStock = variant.stock;
      product.variants[variantIndex].stock -= item.quantity;
      await product.save();

      // Check and dispatch low-stock notification if quantity falls below threshold
      const updatedVariant = product.variants[variantIndex];
      await checkAndNotifyLowStock(product, updatedVariant, prevStock);
    }

    // Fetch store shipping settings
    let shippingFee = 400;
    let freeShippingThreshold = 15000;
    try {
      const storeSettings = await Setting.findOne();
      if (storeSettings) {
        if (storeSettings.shippingFee !== undefined) shippingFee = Number(storeSettings.shippingFee);
        if (storeSettings.freeShippingThreshold !== undefined) freeShippingThreshold = Number(storeSettings.freeShippingThreshold);
      }
    } catch (settingErr) {
      console.warn('Could not load shipping settings, using defaults:', settingErr.message);
    }

    const calculatedShippingPrice = calculatedTotalPrice >= freeShippingThreshold ? 0 : shippingFee;
    const finalTotalPrice = calculatedTotalPrice + calculatedShippingPrice;

    // 2. Create Order
    const order = new Order({
      orderItems,
      shippingDetails,
      shippingPrice: calculatedShippingPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'Card Payment' ? 'Paid' : 'Pending',
      totalPrice: finalTotalPrice,
      user: user || null,
    });

    const createdOrder = await order.save();

    // Create admin notification for new order
    try {
      await Notification.create({
        type: 'ORDER_CREATED',
        title: `New Order #${createdOrder._id.toString().slice(-8).toUpperCase()}`,
        message: `New order placed by ${shippingDetails.firstName} ${shippingDetails.lastName} via ${paymentMethod} (LKR ${finalTotalPrice.toLocaleString()})`,
      });
    } catch (notifErr) {
      console.error('Failed to create order notification:', notifErr);
    }

    res.status(201).json(createdOrder);

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'id name image category')
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((o) => o._id);
    const reviews = await Review.find({
      user: req.user.id,
      order: { $in: orderIds },
    });

    const reviewedSet = new Set(
      reviews
        .filter((r) => r.order && r.product)
        .map((r) => `${r.order.toString()}_${r.product.toString()}`)
    );

    const ordersWithReviews = orders.map((order) => ({
      ...order,
      orderItems: order.orderItems.map((item) => {
        const prodId = item.product?._id
          ? item.product._id.toString()
          : (item.product ? item.product.toString() : '');
        return {
          ...item,
          isReviewed: reviewedSet.has(`${order._id.toString()}_${prodId}`),
        };
      }),
    }));

    res.json(ordersWithReviews);
  } catch (error) {
    console.error('Get My Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name email')
      .populate('orderItems.product', 'category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, cancelReason } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (order) {
      // If updating to Cancelled from non-cancelled, restore stock
      if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
        for (const item of order.orderItems) {
          if (item.product) {
            const product = await Product.findById(item.product);
            if (product && product.variants) {
              const variantIndex = product.variants.findIndex(
                (v) => v.size === item.variant?.size
              );
              if (variantIndex !== -1) {
                product.variants[variantIndex].stock += item.quantity;
                await product.save();
              }
            }
          }
        }
        order.cancelledAt = new Date();
        if (cancelReason) {
          order.cancelReason = cancelReason;
        }
      }

      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;

      const updatedOrder = await order.save();
      
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

// @desc    Cancel order by customer (only allowed when Pending)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Registered customer)
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership: customer must own this order
    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order' });
    }

    // Check if already cancelled
    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'This order is already cancelled' });
    }

    // Customer can only cancel when status is Pending
    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({
        message: `Order cannot be cancelled because its status is ${order.orderStatus}. Only Pending orders can be cancelled.`
      });
    }

    // Restore stock to product variants
    for (const item of order.orderItems) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product && product.variants) {
          const variantIndex = product.variants.findIndex(
            (v) => v.size === item.variant?.size
          );
          if (variantIndex !== -1) {
            product.variants[variantIndex].stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    // Set order status and cancellation details
    order.orderStatus = 'Cancelled';
    order.cancelReason = reason?.trim() || 'Cancelled by customer';
    order.cancelledAt = new Date();

    // If Cash on Delivery and payment was pending, mark as Failed
    if (order.paymentMethod === 'Cash on Delivery' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Failed';
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  cancelOrder,
};
