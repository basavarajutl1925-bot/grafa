const express = require('express');
const PriceAlert = require('../models/PriceAlert');
const Notification = require('../models/Notification');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const alertSchema = Joi.object({
  cropId: Joi.string().required(),
  district: Joi.string().required(),
  alertType: Joi.string()
    .valid('PRICE_DROP', 'PRICE_SPIKE', 'TARGET_ACHIEVED', 'MARKET_TREND')
    .required(),
  targetPrice: Joi.number().required(),
  triggerThreshold: Joi.number().default(10),
});

/**
 * Create price alert
 * POST /api/alerts/subscribe
 */
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { error, value } = alertSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if alert already exists
    const existingAlert = await PriceAlert.findOne({
      userId: req.user.id,
      cropId: value.cropId,
      district: value.district,
      alertType: value.alertType,
      alertStatus: 'active',
    });

    if (existingAlert) {
      return res.status(400).json({ error: 'Alert already exists' });
    }

    const alert = new PriceAlert({
      ...value,
      userId: req.user.id,
    });

    await alert.save();

    res.status(201).json({
      message: 'Alert created successfully',
      alert,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's active alerts
 * GET /api/alerts
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      userId: req.user.id,
      alertStatus: status,
    };

    const alerts = await PriceAlert.find(query)
      .populate('cropId', 'cropName imageUrl priceUnit')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PriceAlert.countDocuments(query);

    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get alert history
 * GET /api/alerts/history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const alerts = await PriceAlert.find({ userId: req.user.id })
      .populate('cropId', 'cropName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ triggeredAt: -1 });

    const total = await PriceAlert.countDocuments({ userId: req.user.id });

    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update alert status
 * PATCH /api/alerts/:id/status
 * { status: "dismissed" }
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, reason } = req.body;

    const validStatuses = ['active', 'triggered', 'dismissed', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const alert = await PriceAlert.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.alertStatus = status;
    if (status === 'dismissed') {
      alert.dismissedAt = new Date();
      alert.dismissReason = reason;
    }

    await alert.save();

    res.json({ message: 'Alert updated', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete alert
 * DELETE /api/alerts/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await PriceAlert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check and trigger alerts (Admin - can be scheduled via cron)
 * POST /api/alerts/trigger
 */
router.post('/trigger', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const PriceHistory = require('../models/PriceHistory');
    const CropDetails = require('../models/CropDetails');

    // Get all active alerts
    const alerts = await PriceAlert.find({ alertStatus: 'active' });

    let triggeredCount = 0;

    for (const alert of alerts) {
      // Get latest price for the crop in that district
      const latestPrice = await PriceHistory.findOne({
        itemId: alert.cropId,
        district: alert.district,
      })
        .sort({ timestamp: -1 })
        .lean();

      if (!latestPrice) continue;

      const currentPrice = latestPrice.price;
      alert.currentPrice = currentPrice;

      let shouldTrigger = false;

      switch (alert.alertType) {
        case 'PRICE_DROP':
          shouldTrigger = currentPrice <= alert.targetPrice * (1 - alert.triggerThreshold / 100);
          break;
        case 'PRICE_SPIKE':
          shouldTrigger = currentPrice >= alert.targetPrice * (1 + alert.triggerThreshold / 100);
          break;
        case 'TARGET_ACHIEVED':
          shouldTrigger = currentPrice >= alert.targetPrice;
          break;
      }

      if (shouldTrigger && !alert.notificationSent) {
        alert.alertStatus = 'triggered';
        alert.triggeredAt = new Date();
        alert.notificationSent = true;

        // Create notification
        const crop = await CropDetails.findById(alert.cropId, 'cropName priceUnit').lean();

        const notification = new Notification({
          userId: alert.userId,
          type: 'PRICE_ALERT',
          title: `${alert.alertType} Alert: ${crop.cropName}`,
          message: `${crop.cropName} in ${alert.district} is now ₹${currentPrice}/${crop.priceUnit}`,
          data: {
            cropId: alert.cropId,
            cropName: crop.cropName,
            price: currentPrice,
            alertType: alert.alertType,
            district: alert.district,
          },
        });

        await notification.save();
        await alert.save();
        triggeredCount++;
      }
    }

    res.json({
      message: `${triggeredCount} alerts triggered`,
      triggeredCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get alert statistics for admin
 * GET /api/alerts/admin/stats
 */
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await PriceAlert.aggregate([
      {
        $group: {
          _id: '$alertType',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$alertStatus', 'active'] }, 1, 0] },
          },
          triggered: {
            $sum: { $cond: [{ $eq: ['$alertStatus', 'triggered'] }, 1, 0] },
          },
        },
      },
    ]);

    const totalAlerts = await PriceAlert.countDocuments();
    const totalUsers = await PriceAlert.distinctCount Users();

    res.json({
      totalAlerts,
      alertsByType: stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
