const CategoryDiscount = require('../models/CategoryDiscount');

// @desc    Get all category discounts (Admin)
// @route   GET /api/discounts
// @access  Private/Admin
const getDiscounts = async (req, res) => {
  try {
    const discounts = await CategoryDiscount.find({}).sort({ createdAt: -1 });
    const now = new Date();

    const formatted = discounts.map(d => {
      const isExpired = now > new Date(d.endDate);
      const isScheduled = d.isActive && now < new Date(d.startDate);
      const isActiveNow = d.isActive && now >= new Date(d.startDate) && now <= new Date(d.endDate);
      const isPaused = !d.isActive;

      let status = 'active';
      if (isPaused) status = 'paused';
      else if (isExpired) status = 'expired';
      else if (isScheduled) status = 'scheduled';
      else if (isActiveNow) status = 'active';

      return {
        ...d.toObject(),
        status,
        isActiveNow,
        isScheduled,
        isExpired,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get currently active category discounts (Public storefront)
// @route   GET /api/discounts/active
// @access  Public
const getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const activeDiscounts = await CategoryDiscount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ discountPercentage: -1 });

    res.json(activeDiscounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create category discount campaign
// @route   POST /api/discounts
// @access  Private/Admin
const createDiscount = async (req, res) => {
  try {
    const { title, category, discountPercentage, startDate, endDate, description, isActive } = req.body;

    if (!title || !category || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const discount = new CategoryDiscount({
      title: title.trim(),
      category: category.trim(),
      discountPercentage: Number(discountPercentage),
      startDate: start,
      endDate: end,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const createdDiscount = await discount.save();
    res.status(201).json(createdDiscount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category discount campaign
// @route   PUT /api/discounts/:id
// @access  Private/Admin
const updateDiscount = async (req, res) => {
  try {
    const { title, category, discountPercentage, startDate, endDate, description, isActive } = req.body;
    const discount = await CategoryDiscount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({ message: 'Discount campaign not found' });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      discount.startDate = start;
      discount.endDate = end;
    } else if (startDate) {
      const start = new Date(startDate);
      if (start >= discount.endDate) {
        return res.status(400).json({ message: 'Start date cannot be after end date' });
      }
      discount.startDate = start;
    } else if (endDate) {
      const end = new Date(endDate);
      if (discount.startDate >= end) {
        return res.status(400).json({ message: 'End date cannot be before start date' });
      }
      discount.endDate = end;
    }

    if (title) discount.title = title.trim();
    if (category) discount.category = category.trim();
    if (discountPercentage) discount.discountPercentage = Number(discountPercentage);
    if (description !== undefined) discount.description = description.trim();
    if (isActive !== undefined) discount.isActive = Boolean(isActive);

    const updated = await discount.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle category discount active status
// @route   PATCH /api/discounts/:id/status
// @access  Private/Admin
const toggleDiscountStatus = async (req, res) => {
  try {
    const discount = await CategoryDiscount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount campaign not found' });
    }

    if (req.body.isActive !== undefined) {
      discount.isActive = Boolean(req.body.isActive);
    } else {
      discount.isActive = !discount.isActive;
    }

    await discount.save();
    res.json({
      message: `Discount "${discount.title}" ${discount.isActive ? 'resumed' : 'paused'} successfully`,
      discount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category discount
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
const deleteDiscount = async (req, res) => {
  try {
    const discount = await CategoryDiscount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount campaign not found' });
    }

    await CategoryDiscount.deleteOne({ _id: discount._id });
    res.json({ message: 'Discount campaign removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDiscounts,
  getActiveDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
};
