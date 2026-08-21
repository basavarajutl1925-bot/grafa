const express = require('express');
const FarmProfile = require('../models/FarmProfile');
const { authMiddleware } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const farmProfileSchema = Joi.object({
  farmName: Joi.string(),
  location: Joi.object({
    coordinates: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).required(),
    district: Joi.string().required(),
    village: Joi.string(),
    state: Joi.string(),
  }).required(),
  areaInHectares: Joi.number().required(),
  soilType: Joi.string(),
  irrigationType: Joi.string(),
  yearsOfFarming: Joi.number(),
  certifications: Joi.array().items(Joi.string()),
});

/**
 * Get or create farm profile
 * GET /api/farm/profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await FarmProfile.findOne({ userId: req.user.id })
      .populate('cropsGrown.cropId', 'cropName season imageUrl')
      .lean();

    if (!profile) {
      return res.status(404).json({ error: 'Farm profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create or update farm profile
 * POST /api/farm/profile
 */
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { error, value } = farmProfileSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let profile = await FarmProfile.findOne({ userId: req.user.id });

    if (profile) {
      // Update existing
      Object.assign(profile, value);
      await profile.save();
      return res.json({ message: 'Profile updated', profile });
    }

    // Create new
    profile = new FarmProfile({
      userId: req.user.id,
      ...value,
    });

    await profile.save();

    res.status(201).json({
      message: 'Farm profile created',
      profile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add crop to farm
 * POST /api/farm/crops
 */
router.post('/crops', authMiddleware, async (req, res) => {
  try {
    const { cropId, season, areaInHectares, plantingDate, expectedHarvestDate } = req.body;

    let profile = await FarmProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ error: 'Farm profile not found' });
    }

    // Check if crop already added
    const existingCrop = profile.cropsGrown.find(c => c.cropId.toString() === cropId);

    if (existingCrop) {
      return res.status(400).json({ error: 'Crop already added to farm' });
    }

    profile.cropsGrown.push({
      cropId,
      season,
      areaInHectares,
      plantingDate,
      expectedHarvestDate,
    });

    await profile.save();

    res.json({ message: 'Crop added to farm', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove crop from farm
 * DELETE /api/farm/crops/:cropId
 */
router.delete('/crops/:cropId', authMiddleware, async (req, res) => {
  try {
    const profile = await FarmProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ error: 'Farm profile not found' });
    }

    profile.cropsGrown = profile.cropsGrown.filter(
      c => c.cropId.toString() !== req.params.cropId
    );

    await profile.save();

    res.json({ message: 'Crop removed from farm', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get farms by district
 * GET /api/farm/district/:district?verified=true
 */
router.get('/district/:district', async (req, res) => {
  try {
    const { verified, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = { 'location.district': req.params.district };

    if (verified === 'true') {
      query.isVerified = true;
    }

    const farms = await FarmProfile.find(query)
      .select('-bankDetails')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('cropsGrown.cropId', 'cropName imageUrl')
      .lean();

    const total = await FarmProfile.countDocuments(query);

    res.json({
      district: req.params.district,
      verified: verified === 'true',
      farms,
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
 * Get nearby farmers (geospatial)
 * GET /api/farm/nearby?lat=19.0&long=72.8&maxDistance=50000
 */
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { lat, long, maxDistance = 50000 } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ error: 'Provide lat and long' });
    }

    const farms = await FarmProfile.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .select('-bankDetails')
      .limit(20)
      .populate('cropsGrown.cropId', 'cropName')
      .lean();

    res.json({ farms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get farm analytics
 * GET /api/farm/analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const profile = await FarmProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ error: 'Farm profile not found' });
    }

    const totalArea = profile.cropsGrown.reduce((sum, c) => sum + (c.areaInHectares || 0), 0);

    res.json({
      farmName: profile.farmName,
      totalArea,
      cropsCount: profile.cropsGrown.length,
      crops: profile.cropsGrown,
      soilType: profile.soilType,
      irrigationType: profile.irrigationType,
      yearInFarming: profile.yearsOfFarming,
      certifications: profile.certifications,
      isVerified: profile.isVerified,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
