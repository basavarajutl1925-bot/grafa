require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const itemRoutes = require('./routes/items');
const locationRoutes = require('./routes/location');
const cropRoutes = require('./routes/crops');
const weatherRoutes = require('./routes/weather');
const farmRoutes = require('./routes/farm');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'grafa-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } else {
    console.warn('MONGODB_URI is not configured; starting without a database connection');
  }

  return app.listen(PORT, () => {
    console.log(`GRAFA API listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
