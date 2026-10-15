const express = require('express');
const router = express.Router();
const {
  createReview,
  getAdminReviews,
  updateReviewStatus,
  getApprovedReviews,
  getMyReviews
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createReview)
  .get(getApprovedReviews);

router.get('/myreviews', protect, getMyReviews);

router.route('/admin')
  .get(protect, authorize('developer', 'owner'), getAdminReviews);

router.route('/:id/status')
  .put(protect, authorize('developer', 'owner'), updateReviewStatus);

module.exports = router;
