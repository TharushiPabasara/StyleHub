const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LOW_STOCK', 'ORDER_CREATED', 'GENERAL'],
    default: 'LOW_STOCK',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productName: {
    type: String,
  },
  variant: {
    size: String,
    color: String,
    stock: Number,
    threshold: {
      type: Number,
      default: 2,
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
