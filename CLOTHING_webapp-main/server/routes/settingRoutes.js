const express = require('express');
const router = express.Router();
const { getContactSettings, updateContactSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/contact')
  .get(getContactSettings)
  .put(protect, authorize('developer', 'owner'), updateContactSettings);

module.exports = router;
