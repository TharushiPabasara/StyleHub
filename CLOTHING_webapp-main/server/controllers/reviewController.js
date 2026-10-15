const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  try {
    // Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }

    // Check if order is Delivered
    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ message: 'You can only review delivered products' });
    }

    // Check if the product is in this order
    const hasProduct = order.orderItems.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (!hasProduct) {
      return res.status(400).json({ message: 'Product not found in this order' });
    }

    // Check if user already reviewed this exact product for this exact order
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' });
    }

    const review = new Review({
      user: req.user._id,
      product: productId,
      order: orderId,
      rating: Number(rating),
      comment,
      status: 'Pending'
    });

    await review.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews for admin
// @route   GET /api/reviews/admin
// @access  Private/Admin
const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'id name email')
      .populate('product', 'id name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update review status
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review) {
      review.status = req.body.status || review.status;
      const updatedReview = await review.save();
      res.json(updatedReview);
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all approved reviews
// @route   GET /api/reviews
// @access  Public
const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'Approved' })
      .populate('user', 'id name')
      .populate('product', 'id name image')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user reviews
// @route   GET /api/reviews/myreviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getAdminReviews,
  updateReviewStatus,
  getApprovedReviews,
  getMyReviews
};
