const express = require('express');
const Ad = require('../models/Ad');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all ads for a user (district-based filtering)
 */
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const { district } = req.query;

    if (!district) {
      return res.status(400).json({ error: 'district query parameter required' });
    }

    const ads = await Ad.find({
      district,
      status: 'active',
    })
      .populate('userId', 'deviceId')
      .limit(100)
      .lean();

    res.json({ ads, count: ads.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create ad request (Normal user)
 */
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { title, description, district, category, shopLocation, contactPhone, contactEmail, images } =
      req.body;

    if (!title || !district || !shopLocation) {
      return res.status(400).json({ error: 'title, district, shopLocation required' });
    }

    const ad = new Ad({
      userId: req.user.id,
      title,
      description,
      district,
      category,
      shopLocation,
      contactPhone,
      contactEmail,
      images: images || [],
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await ad.save();

    res.status(201).json({ ad, message: 'Ad request submitted for approval' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's own ads
 */
router.get('/my-ads', authMiddleware, async (req, res) => {
  try {
    const ads = await Ad.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track ad view
 */
router.post('/:adId/view', async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.adId, { $inc: { impressions: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track ad click
 */
router.post('/:adId/click', async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.adId, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ad analytics (Admin only)
 */
router.get('/analytics/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: 'active' });
    const pendingAds = await Ad.countDocuments({ status: 'pending' });
    const totalImpressions = await Ad.aggregate([{ $group: { _id: null, total: { $sum: '$impressions' } } }]);
    const totalClicks = await Ad.aggregate([{ $group: { _id: null, total: { $sum: '$clicks' } } }]);

    res.json({
      totalAds,
      activeAds,
      pendingAds,
      totalImpressions: totalImpressions[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
