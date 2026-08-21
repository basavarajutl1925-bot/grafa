const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Admin Registration (Only allow first admin setup)
 */
router.post('/admin/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const user = new User({
      email,
      password,
      role: 'admin',
      district: 'admin',
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin Login
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Normal User Registration/Login (Device-based)
 */
router.post('/user/login', async (req, res) => {
  try {
    const { deviceId, latitude, longitude } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'deviceId, latitude, longitude required' });
    }

    let user = await User.findOne({ deviceId });

    if (!user) {
      user = new User({
        deviceId,
        latitude,
        longitude,
        role: 'user',
        lastLocationUpdate: new Date(),
      });
    } else {
      user.latitude = latitude;
      user.longitude = longitude;
      user.lastLocationUpdate = new Date();
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, deviceId: user.deviceId, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user._id, deviceId: user.deviceId, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user location
 */
router.post('/location/update', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude, longitude required' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      latitude,
      longitude,
      lastLocationUpdate: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
