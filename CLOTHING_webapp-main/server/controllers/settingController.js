const Setting = require('../models/Setting');

const defaultSettings = {
  companyName: 'StyleHub',
  companyPhone: '0765564180',
  companyEmail: 'stylehubclothing2015@gmail.com',
  whatsappNumber: '0765564180',
  locationCity: 'Akuressa Town',
  locationAddress: 'Main Street, Akuressa Town, Matara, Southern Province',
  boutiqueHoursTitle: 'Boutique Hours',
  boutiqueHoursDays: 'Daily: 9:00 AM – 8:00 PM',
  boutiqueHoursNote: 'Open all week Including Poya',
  mapQuery: 'Akuressa, Sri Lanka',
  shippingFee: 400,
  freeShippingThreshold: 15000,
  estimatedDeliveryTime: '2 to 4 Business Days',
  announcementText: 'Island-wide Delivery: LKR 400 | Complimentary Shipping on orders over LKR 15,000',
  announcements: [
    'Island-wide Delivery: LKR 400 • Complimentary Shipping on orders over LKR 15,000',
    'New Drops Every Week • Discover Our Handpicked Boutique Styles',
    'Hassle-Free 7-Day Returns & Exchanges Across Sri Lanka',
    'Cash on Delivery & Secure Online Card Payment Available'
  ],
  announcementMode: 'marquee',
  enableFreeReturns: true,
  returnPolicyDays: 14,
  returnPolicyTitle: 'Free Returns & Exchanges',
  returnPolicyDescription: 'Within 14 days of purchase for unworn items with original tags'
};

// @desc    Get contact & store settings
// @route   GET /api/settings/contact
// @access  Public
const getContactSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(defaultSettings);
    }
    res.json(settings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update contact & store settings
// @route   PUT /api/settings/contact
// @access  Private/Admin
const updateContactSettings = async (req, res) => {
  try {
    const {
      companyName,
      companyPhone,
      companyEmail,
      whatsappNumber,
      locationCity,
      locationAddress,
      boutiqueHoursTitle,
      boutiqueHoursDays,
      boutiqueHoursNote,
      mapQuery,
      shippingFee,
      freeShippingThreshold,
      estimatedDeliveryTime,
      announcementText,
      announcements,
      announcementMode,
      enableFreeReturns,
      returnPolicyDays,
      returnPolicyTitle,
      returnPolicyDescription
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(defaultSettings);
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyPhone !== undefined) settings.companyPhone = companyPhone;
    if (companyEmail !== undefined) settings.companyEmail = companyEmail;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
    if (locationCity !== undefined) settings.locationCity = locationCity;
    if (locationAddress !== undefined) settings.locationAddress = locationAddress;
    if (boutiqueHoursTitle !== undefined) settings.boutiqueHoursTitle = boutiqueHoursTitle;
    if (boutiqueHoursDays !== undefined) settings.boutiqueHoursDays = boutiqueHoursDays;
    if (boutiqueHoursNote !== undefined) settings.boutiqueHoursNote = boutiqueHoursNote;
    if (mapQuery !== undefined) settings.mapQuery = mapQuery;
    if (shippingFee !== undefined) settings.shippingFee = Number(shippingFee);
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
    if (estimatedDeliveryTime !== undefined) settings.estimatedDeliveryTime = estimatedDeliveryTime;
    if (announcementText !== undefined) settings.announcementText = announcementText;
    if (announcements !== undefined) {
      if (Array.isArray(announcements)) {
        settings.announcements = announcements.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof announcements === 'string') {
        settings.announcements = announcements.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }
    if (announcementMode !== undefined) settings.announcementMode = announcementMode;
    if (enableFreeReturns !== undefined) settings.enableFreeReturns = Boolean(enableFreeReturns);
    if (returnPolicyDays !== undefined) settings.returnPolicyDays = Number(returnPolicyDays);
    if (returnPolicyTitle !== undefined) settings.returnPolicyTitle = returnPolicyTitle;
    if (returnPolicyDescription !== undefined) settings.returnPolicyDescription = returnPolicyDescription;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getContactSettings,
  updateContactSettings
};
