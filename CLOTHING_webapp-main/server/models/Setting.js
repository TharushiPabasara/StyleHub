const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'StyleHub'
  },
  companyPhone: {
    type: String,
    default: '0765564180'
  },
  companyEmail: {
    type: String,
    default: 'stylehubclothing2015@gmail.com'
  },
  whatsappNumber: {
    type: String,
    default: '0765564180'
  },
  locationCity: {
    type: String,
    default: 'Akuressa Town'
  },
  locationAddress: {
    type: String,
    default: 'Main Street, Akuressa Town, Matara, Southern Province'
  },
  boutiqueHoursTitle: {
    type: String,
    default: 'Boutique Hours'
  },
  boutiqueHoursDays: {
    type: String,
    default: 'Daily: 9:00 AM – 8:00 PM'
  },
  boutiqueHoursNote: {
    type: String,
    default: 'Open all week Including Poya'
  },
  mapQuery: {
    type: String,
    default: 'Akuressa, Sri Lanka'
  },
  shippingFee: {
    type: Number,
    default: 400
  },
  freeShippingThreshold: {
    type: Number,
    default: 15000
  },
  estimatedDeliveryTime: {
    type: String,
    default: '2 to 4 Business Days'
  },
  announcementText: {
    type: String,
    default: 'Island-wide Delivery: LKR 400 | Complimentary Shipping on orders over LKR 15,000'
  },
  announcements: {
    type: [String],
    default: [
      'Island-wide Delivery: LKR 400 • Complimentary Shipping on orders over LKR 15,000',
      'New Drops Every Week • Discover Our Handpicked Boutique Styles',
      'Hassle-Free 7-Day Returns & Exchanges Across Sri Lanka',
      'Cash on Delivery & Secure Online Card Payment Available'
    ]
  },
  announcementMode: {
    type: String,
    enum: ['marquee', 'slider'],
    default: 'marquee'
  },
  enableFreeReturns: {
    type: Boolean,
    default: true
  },
  returnPolicyDays: {
    type: Number,
    default: 14
  },
  returnPolicyTitle: {
    type: String,
    default: 'Free Returns & Exchanges'
  },
  returnPolicyDescription: {
    type: String,
    default: 'Within 14 days of purchase for unworn items with original tags'
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
