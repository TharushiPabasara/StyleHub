const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      let emailChanged = false;
      let verificationToken;

      if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
        const normalizedEmail = req.body.email.toLowerCase().trim();
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        
        user.email = normalizedEmail;
        user.isVerified = true;
        emailChanged = true;
        verificationToken = user.getVerificationToken();
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      if (emailChanged) {
        const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
        const verifyUrl = `${clientUrl}/verify/${verificationToken}`;
        const message = `
          <h1>Email Update</h1>
          <p>You recently changed your email address. Please verify your new email by clicking the link below:</p>
          <a href=${verifyUrl} clicktracking=off>${verifyUrl}</a>
        `;
        try {
          await sendEmail({
            to: updatedUser.email,
            subject: 'StyleHub - Verify New Email',
            html: message
          });
        } catch (err) {
          console.error('Failed to send email update verification:', err);
        }
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all staff users
// @route   GET /api/users/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
  try {
    // Only return staff and owners based on who is asking
    let query = { role: { $in: ['inventory_handler', 'sales_staff'] } };
    
    if (req.user.role === 'developer') {
       query = { role: { $in: ['owner', 'inventory_handler', 'sales_staff'] } };
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all customers
// @route   GET /api/users/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Create a new staff or owner
// @route   POST /api/users/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate role
    if (!['owner', 'inventory_handler', 'sales_staff'].includes(role)) {
       return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Permissions check
    if (role === 'owner' && req.user.role !== 'developer') {
       return res.status(403).json({ message: 'Only developers can create owners' });
    }
    if (['inventory_handler', 'sales_staff'].includes(role) && !['developer', 'owner'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Not authorized to create staff' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isVerified: true // assume staff created by admin are auto-verified
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user._id.toString() === userToDelete._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Prevent deleting developer
    if (userToDelete.role === 'developer') {
      return res.status(403).json({ message: 'Developer accounts cannot be deleted' });
    }

    // Permissions check: owner cannot delete other owners or developers
    if (req.user.role === 'owner' && ['owner', 'developer'].includes(userToDelete.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update staff or user account
// @route   PUT /api/users/:id
// @access  Private (developer, owner)
const updateStaff = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protection: developer account can only be edited by developer
    if (userToUpdate.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only developers can edit developer accounts' });
    }

    // Protection: owner cannot edit other owners unless it is their own account
    if (
      req.user.role === 'owner' &&
      userToUpdate.role === 'owner' &&
      req.user._id.toString() !== userToUpdate._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to edit another owner account' });
    }

    // If changing role
    if (role && role !== userToUpdate.role) {
      // Valid roles
      if (!['owner', 'inventory_handler', 'sales_staff', 'customer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Only developer can assign or modify 'owner' role
      if ((role === 'owner' || userToUpdate.role === 'owner') && req.user.role !== 'developer') {
        return res.status(403).json({ message: 'Only developers can assign or modify the owner role' });
      }

      // Owner can only assign 'inventory_handler' or 'sales_staff'
      if (['inventory_handler', 'sales_staff'].includes(role) && !['developer', 'owner'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to assign staff roles' });
      }

      userToUpdate.role = role;
    }

    // If changing email, check for duplicate
    if (email && email !== userToUpdate.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userToUpdate._id.toString()) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      userToUpdate.email = email;
    }

    if (name) {
      userToUpdate.name = name;
    }

    if (password && password.trim().length >= 6) {
      userToUpdate.password = password;
    }

    const updatedUser = await userToUpdate.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      message: 'Staff updated successfully'
    });
  } catch (error) {
    console.error('Update Staff Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getStaff,
  createStaff,
  updateStaff,
  getCustomers,
  deleteUser
};

