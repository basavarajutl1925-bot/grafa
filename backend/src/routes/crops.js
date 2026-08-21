const express = require('express');
const CropDetails = require('../models/CropDetails');
const PriceHistory = require('../models/PriceHistory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const cropSchema = Joi.object({
  cropName: Joi.string().required(),
  cropFamily: Joi.string(),
  season: Joi.array().items(Joi.string().valid('Kharif', 'Rabi', 'Zaid')).required(),
  imageUrl: Joi.string().uri(),
  description: Joi.string(),
  avgYield: Joi.number(),
  waterRequirement: Joi.number(),
  soilType: Joi.array().items(Joi.string()),
  tempRange: Joi.object({
    min: Joi.number(),
    max: Joi.number(),
  }),
  harvestDays: Joi.number(),
  districtAvailability: Joi.array().items(Joi.string()),
});

/**
 * Get all crops with optional filtering
 * GET /api/crops?season=Kharif&district=Mumbai&search=Rice
 */
router.get('/', async (req, res) => {
  try {
    const { season, district, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (season) {
      query.season = season;
    }

    if (district) {
      query.districtAvailability = district;
    }

    if (search) {
      query.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const crops = await CropDetails.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CropDetails.countDocuments(query);

    res.json({
      crops,
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
 * Get crop details by ID with price history
 * GET /api/crops/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const crop = await CropDetails.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    // Get latest prices
    const priceHistory = await PriceHistory.find({ itemId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();

    // Get 7-day average prices by district
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const districtPrices = await PriceHistory.aggregate([
      {
        $match: {
          itemId: req.params.id ? require('mongoose').Types.ObjectId(req.params.id) : null,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$district',
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      crop,
      priceHistory: priceHistory.slice(0, 7),
      districtPrices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add new crop (Admin only)
 * POST /api/crops
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error, value } = cropSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingCrop = await CropDetails.findOne({ cropName: value.cropName });

    if (existingCrop) {
      return res.status(400).json({ error: 'Crop already exists' });
    }

    const crop = new CropDetails({
      ...value,
      approvedBy: req.user.id,
    });

    await crop.save();

    res.status(201).json({
      message: 'Crop added successfully',
      crop,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update crop (Admin only)
 * PUT /api/crops/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error, value } = cropSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({ errors: error.details.map(e => e.message) });
    }

    const crop = await CropDetails.findByIdAndUpdate(
      req.params.id,
      { ...value, updatedAt: new Date() },
      { new: true }
    );

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    res.json({
      message: 'Crop updated successfully',
      crop,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete crop (Admin only - soft delete)
 * DELETE /api/crops/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const crop = await CropDetails.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    res.json({ message: 'Crop deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get diseases for a crop
 * GET /api/crops/:id/diseases
 */
router.get('/:id/diseases', async (req, res) => {
  try {
    const { cropId } = req.params;
    const CropDisease = require('../models/CropDisease');

    const diseases = await CropDisease.find({
      cropAffected: cropId,
      isActive: true,
    }).lean();

    res.json({ diseases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get seasonal crops
 * GET /api/crops/seasonal/:season
 */
router.get('/seasonal/:season', async (req, res) => {
  try {
    const { season } = req.params;
    const { district } = req.query;

    let query = {
      season: season,
      isActive: true,
    };

    if (district) {
      query.districtAvailability = district;
    }

    const crops = await CropDetails.find(query).sort({ cropName: 1 });

    res.json({ season, crops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
