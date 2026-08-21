const express = require('express');
const Ad = require('../models/Ad');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Get pending ad requests (Admin only)
 */
router.get('/ads/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const ads = await Ad.find({ status: 'pending' })
      .populate('userId', 'deviceId contactPhone')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Ad.countDocuments({ status: 'pending' });

    res.json({ ads, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve ad (Admin only)
 */
router.post('/ads/:adId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.adId,
      { status: 'active' },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ ad, message: 'Ad approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject ad (Admin only)
 */
router.post('/ads/:adId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.adId,
      { status: 'rejected', metadata: { rejectionReason: reason } },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ ad, message: 'Ad rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk approve ads (Admin only) - For handling high volume
 */
router.post('/ads/bulk/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { adIds } = req.body;

    if (!Array.isArray(adIds) || adIds.length === 0) {
      return res.status(400).json({ error: 'adIds array required' });
    }

    const result = await Ad.updateMany(
      { _id: { $in: adIds } },
      { status: 'active' }
    );

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dashboard stats (Admin only)
 */
router.get('/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = {
      totalPendingAds: await Ad.countDocuments({ status: 'pending' }),
      totalActiveAds: await Ad.countDocuments({ status: 'active' }),
      totalRejectedAds: await Ad.countDocuments({ status: 'rejected' }),
      adsByDistrict: await Ad.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$district', count: { $sum: 1 } } },
      ]),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
