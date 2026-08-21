const express = require('express');
const WeatherData = require('../models/WeatherData');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const weatherSchema = Joi.object({
  district: Joi.string().required(),
  date: Joi.date().required(),
  temperature: Joi.object({
    min: Joi.number().required(),
    max: Joi.number().required(),
    avg: Joi.number(),
  }).required(),
  humidity: Joi.number().min(0).max(100),
  rainfall: Joi.number().min(0),
  windSpeed: Joi.number(),
  soilMoisture: Joi.number(),
  condition: Joi.string(),
  uvIndex: Joi.number(),
  forecast7Day: Joi.array().items(
    Joi.object({
      date: Joi.date(),
      tempMin: Joi.number(),
      tempMax: Joi.number(),
      condition: Joi.string(),
      rainfall: Joi.number(),
    })
  ),
});

/**
 * Get current weather for district
 * GET /api/weather/:district/current
 */
router.get('/:district/current', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weather = await WeatherData.findOne({
      district: req.params.district,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).lean();

    if (!weather) {
      return res.status(404).json({ error: 'Weather data not available' });
    }

    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get 7-day weather forecast
 * GET /api/weather/:district/forecast
 */
router.get('/:district/forecast', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const forecast = await WeatherData.find({
      district: req.params.district,
      date: {
        $gte: today,
        $lte: sevenDaysLater,
      },
    })
      .sort({ date: 1 })
      .lean();

    if (forecast.length === 0) {
      // Return forecast from the latest weather entry if available
      const latest = await WeatherData.findOne({
        district: req.params.district,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (latest && latest.forecast7Day) {
        return res.json(latest.forecast7Day);
      }

      return res.status(404).json({ error: 'Forecast not available' });
    }

    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get historical weather data
 * GET /api/weather/:district/history?days=30
 */
router.get('/:district/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await WeatherData.find({
      district: req.params.district,
      date: { $gte: startDate },
    })
      .sort({ date: -1 })
      .lean();

    // Calculate trends
    const avgTemp = history.reduce((sum, w) => sum + (w.temperature.avg || (w.temperature.min + w.temperature.max) / 2), 0) / history.length;
    const totalRainfall = history.reduce((sum, w) => sum + (w.rainfall || 0), 0);
    const avgHumidity = history.reduce((sum, w) => sum + (w.humidity || 0), 0) / history.length;

    res.json({
      district: req.params.district,
      days: parseInt(days),
      data: history,
      trends: {
        avgTemp: parseFloat(avgTemp.toFixed(2)),
        totalRainfall: parseFloat(totalRainfall.toFixed(2)),
        avgHumidity: parseFloat(avgHumidity.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add weather data (Admin only)
 * POST /api/weather
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error, value } = weatherSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if weather data already exists for this district and date
    const existingWeather = await WeatherData.findOne({
      district: value.district,
      date: {
        $gte: new Date(value.date).setHours(0, 0, 0, 0),
        $lt: new Date(value.date).setHours(23, 59, 59, 999),
      },
    });

    if (existingWeather) {
      // Update existing
      const updated = await WeatherData.findByIdAndUpdate(
        existingWeather._id,
        { ...value, updatedBy: req.user.id },
        { new: true }
      );
      return res.json({ message: 'Weather updated', data: updated });
    }

    // Create new
    const weather = new WeatherData({
      ...value,
      updatedBy: req.user.id,
    });

    await weather.save();

    res.status(201).json({
      message: 'Weather data added',
      data: weather,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk upload weather data (Admin only)
 * POST /api/weather/bulk
 * Expected: array of weather objects
 */
router.post('/bulk', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Expected array of weather data' });
    }

    const validatedData = data.map(item => {
      const { error, value } = weatherSchema.validate(item);
      if (error) throw new Error(`${item.district}: ${error.message}`);
      return { ...value, updatedBy: req.user.id };
    });

    // Upsert weather data
    const results = await Promise.all(
      validatedData.map(item =>
        WeatherData.findOneAndUpdate(
          {
            district: item.district,
            date: {
              $gte: new Date(item.date).setHours(0, 0, 0, 0),
              $lt: new Date(item.date).setHours(23, 59, 59, 999),
            },
          },
          item,
          { upsert: true, new: true }
        )
      )
    );

    res.status(201).json({
      message: `${results.length} weather records processed`,
      count: results.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get weather for multiple districts
 * POST /api/weather/districts
 * { "districts": ["Mumbai", "Pune"] }
 */
router.post('/districts', async (req, res) => {
  try {
    const { districts } = req.body;

    if (!Array.isArray(districts) || districts.length === 0) {
      return res.status(400).json({ error: 'Provide array of districts' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weatherData = await WeatherData.find({
      district: { $in: districts },
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).lean();

    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
