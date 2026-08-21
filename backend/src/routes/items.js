const express = require('express');
const Item = require('../models/Item');
const PriceHistory = require('../models/PriceHistory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const PricePredictionModel = require('../utils/predictionModel');

const router = express.Router();

/**
 * Add new item (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, unit, description, districts } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name required' });
    }

    const item = new Item({
      name,
      category,
      unit: unit || 'kg',
      description,
      addedBy: req.user.id,
      districts: districts || [],
    });

    await item.save();
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add price data for item (Admin only)
 */
router.post('/:itemId/price', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { price, district, source } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'price required' });
    }

    const priceHistory = new PriceHistory({
      itemId: req.params.itemId,
      price,
      district,
      source: source || 'admin',
      timestamp: new Date(),
    });

    await priceHistory.save();
    res.status(201).json({ priceHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk add price data (Admin only) - For high volume requests
 */
router.post('/bulk/prices', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { prices } = req.body; // Array of { itemId, price, district }

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ error: 'prices array required' });
    }

    const docs = prices.map(p => ({
      itemId: p.itemId,
      price: p.price,
      district: p.district,
      source: 'bulk_import',
      timestamp: new Date(),
    }));

    const result = await PriceHistory.insertMany(docs, { ordered: false });
    res.status(201).json({ inserted: result.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get price predictions for item
 */
router.get('/:itemId/predict', async (req, res) => {
  try {
    const { daysAhead = 7, district } = req.query;

    const priceData = await PriceHistory.find({
      itemId: req.params.itemId,
      ...(district && { district }),
    })
      .sort({ timestamp: -1 })
      .limit(90)
      .lean();

    if (priceData.length === 0) {
      return res.json({ prediction: null, message: 'Insufficient price history data' });
    }

    const model = new PricePredictionModel(
      priceData
        .reverse()
        .map(d => ({ timestamp: d.timestamp, price: d.price }))
    );

    const prediction = model.predict(parseInt(daysAhead));
    const stats = model.getStatistics();

    res.json({ prediction, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all items
 */
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ isActive: true })
      .select('name category unit description')
      .lean();

    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current prices for item across districts
 */
router.get('/:itemId/prices', async (req, res) => {
  try {
    const prices = await PriceHistory.find({
      itemId: req.params.itemId,
    })
      .sort({ timestamp: -1 })
      .limit(365)
      .lean();

    // Group by district and get latest price
    const latestByDistrict = {};
    prices.forEach(p => {
      if (!latestByDistrict[p.district]) {
        latestByDistrict[p.district] = p;
      }
    });

    res.json({ prices: Object.values(latestByDistrict) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
