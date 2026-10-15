const express = require('express');
const router = express.Router();
const {
  getDiscounts,
  getActiveDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
} = require('../controllers/categoryDiscountController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to fetch active discounts for storefront
router.get('/active', getActiveDiscounts);

// Admin/Inventory routes
router.route('/')
  .get(protect, authorize('developer', 'owner', 'inventory_handler'), getDiscounts)
  .post(protect, authorize('developer', 'owner', 'inventory_handler'), createDiscount);

router.route('/:id')
  .put(protect, authorize('developer', 'owner', 'inventory_handler'), updateDiscount)
  .delete(protect, authorize('developer', 'owner', 'inventory_handler'), deleteDiscount);

router.route('/:id/status')
  .patch(protect, authorize('developer', 'owner', 'inventory_handler'), toggleDiscountStatus);

module.exports = router;
