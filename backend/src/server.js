require('dotenv').config();
const express = require('express');

















































































































































































































































































module.exports = router;});  }    res.status(400).json({ error: error.message });  } catch (error) {    });      count: result.length,      message: `${result.length} diseases added`,    res.status(201).json({    const result = await CropDisease.insertMany(validatedDiseases);    });      return { ...value, approvedBy: req.user.id };      if (error) throw new Error(`${item.diseaseName}: ${error.message}`);      const { error, value } = diseaseSchema.validate(item);    const validatedDiseases = diseases.map(item => {    }      return res.status(400).json({ error: 'Expected array of diseases' });    if (!Array.isArray(diseases)) {    const { diseases } = req.body;  try {router.post('/bulk', authMiddleware, adminMiddleware, async (req, res) => { */ * POST /api/diseases/bulk * Bulk add diseases (Admin only)/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    });      diseases,      count: diseases.length,      season: req.params.season,    res.json({      .lean();      .sort({ severity: -1 })      .limit(parseInt(limit))      .populate('cropAffected', 'cropName imageUrl')    })      isActive: true,      seasonalOccurrence: req.params.season,    const diseases = await CropDisease.find({    const { limit = 20 } = req.query;  try {router.get('/season/:season', async (req, res) => { */ * GET /api/diseases/season/:season * Get diseases by season/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    res.json({ message: 'Disease deactivated' });    }      return res.status(404).json({ error: 'Disease not found' });    if (!disease) {    );      { new: true }      { isActive: false },      req.params.id,    const disease = await CropDisease.findByIdAndUpdate(  try {router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => { */ * DELETE /api/diseases/:id * Delete disease (Admin only)/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    });      disease,      message: 'Disease updated successfully',    res.json({    }      return res.status(404).json({ error: 'Disease not found' });    if (!disease) {    );      { new: true }      value,      req.params.id,    const disease = await CropDisease.findByIdAndUpdate(    }      return res.status(400).json({ errors: error.details.map(e => e.message) });    if (error) {    const { error, value } = diseaseSchema.validate(req.body, { abortEarly: false });  try {router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => { */ * PUT /api/diseases/:id * Update disease (Admin only)/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    });      disease,      message: 'Disease added successfully',    res.status(201).json({    await disease.save();    });      approvedBy: req.user.id,      ...value,    const disease = new CropDisease({    }      return res.status(400).json({ error: 'Disease already exists' });    if (existing) {    const existing = await CropDisease.findOne({ diseaseName: value.diseaseName });    // Check if disease already exists    }      return res.status(400).json({ error: error.details[0].message });    if (error) {    const { error, value } = diseaseSchema.validate(req.body);  try {router.post('/', authMiddleware, adminMiddleware, async (req, res) => { */ * POST /api/diseases * Add disease (Admin only)/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    res.json({ diseases });      .lean();      .populate('cropAffected', 'cropName imageUrl')      .limit(parseInt(limit))      .sort({ score: { $meta: 'textScore' } })    )      { score: { $meta: 'textScore' } }      { $text: { $search: q }, isActive: true },    const diseases = await CropDisease.find(    }      return res.status(400).json({ error: 'Query must be at least 2 characters' });    if (!q || q.length < 2) {    const { q, limit = 20 } = req.query;  try {router.get('/search', async (req, res) => { */ * GET /api/diseases/search?q=rust * Search diseases by name or symptoms/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    res.json(disease);    }      return res.status(404).json({ error: 'Disease not found' });    if (!disease) {      .lean();      .populate('cropAffected', 'cropName imageUrl waterRequirement soilType')    const disease = await CropDisease.findById(req.params.id)  try {router.get('/:id', async (req, res) => { */ * GET /api/diseases/:id * Get disease by ID/**});  }    res.status(500).json({ error: error.message });  } catch (error) {    });      },        totalPages: Math.ceil(total / limit),        limit: parseInt(limit),        page: parseInt(page),        total,      pagination: {      diseases,    res.json({    const total = await CropDisease.countDocuments(query);      .sort({ severity: -1, createdAt: -1 });      .limit(parseInt(limit))      .skip(skip)      .populate('cropAffected', 'cropName imageUrl')    const diseases = await CropDisease.find(query)    }      query.seasonalOccurrence = season;    if (season) {    }      query.severity = severity;    if (severity) {    }      query.cropAffected = cropId;    if (cropId) {    let query = { isActive: true };    const skip = (page - 1) * limit;    const { cropId, severity, season, page = 1, limit = 20 } = req.query;  try {router.get('/', async (req, res) => { */ * GET /api/diseases?crop=:cropId&severity=MODERATE * Get all diseases/**});  researchLink: Joi.string().uri(),  }),    rainfall: Joi.string(),    idealHumidity: Joi.string(),    }),      max: Joi.number(),      min: Joi.number(),    idealTemperature: Joi.object({  weatherConditions: Joi.object({  affectedStages: Joi.array().items(Joi.string()),  seasonalOccurrence: Joi.array().items(Joi.string()),  severity: Joi.string().valid('MILD', 'MODERATE', 'SEVERE'),  imageUrl: Joi.string().uri(),  organicAlternatives: Joi.array().items(Joi.string()),  ),    })      daysTillHarvest: Joi.number(),      concentration: Joi.string(),      dosage: Joi.string(),      name: Joi.string(),    Joi.object({  pesticides: Joi.array().items(  preventiveMeasures: Joi.array().items(Joi.string()),  treatment: Joi.string(),  symptoms: Joi.array().items(Joi.string()),  cropAffected: Joi.string().required(),  diseaseName: Joi.string().required(),const diseaseSchema = Joi.object({const router = express.Router();const Joi = require('joi');const { authMiddleware, adminMiddleware } = require('../middleware/auth');const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const itemRoutes = require('./routes/items');
const locationRoutes = require('./routes/location');
const cropRoutes = require('./routes/crops');
const weatherRoutes = require('./routes/weather');
const farmRoutes = require('./routes/farm');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');
const diseaseRoutes = require('./routes/diseases');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
});

app.use(limiter);

// Database connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grafa', {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Routes
app.use('/api/auth', strictLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/diseases', diseaseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
