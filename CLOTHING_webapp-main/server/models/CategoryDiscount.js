const mongoose = require('mongoose');

const categoryDiscountSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true, // 'Menswear', 'Womenswear', 'Accessories', or 'All'
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('CategoryDiscount', categoryDiscountSchema);
