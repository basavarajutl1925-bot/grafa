require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Ad = require('../src/models/Ad');
const PriceHistory = require('../src/models/PriceHistory');
const CropDetails = require('../src/models/CropDetails');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'testadmin@grafa.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'GrafaTest@2026';
const USER_DEVICE_ID = process.env.SEED_DEVICE_ID || 'grafa-test-device-001';

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI or MONGO_URI is required');

  await mongoose.connect(mongoUri);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { email: ADMIN_EMAIL, password: passwordHash, role: 'admin', district: 'admin', isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const user = await User.findOneAndUpdate(
    { deviceId: USER_DEVICE_ID },
    { $set: { deviceId: USER_DEVICE_ID, role: 'user', district: 'Hassan', latitude: 13.0033, longitude: 76.1004, isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const itemSeeds = [
    { name: 'Tomato', category: 'Vegetable', unit: 'kg', description: 'Fresh market tomato', districts: ['Hassan'] },
    { name: 'Onion', category: 'Vegetable', unit: 'kg', description: 'Red onion', districts: ['Hassan'] },
    { name: 'Ragi', category: 'Grain', unit: 'kg', description: 'Finger millet', districts: ['Hassan'] },
  ];

  const items = [];
  for (const itemSeed of itemSeeds) {
    items.push(await Item.findOneAndUpdate(
      { name: itemSeed.name },
      { $set: { ...itemSeed, addedBy: admin._id, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ));
  }

  const priceValues = [
    [92, 95, 98, 101, 99, 103, 105],
    [38, 40, 39, 42, 41, 43, 44],
    [46, 47, 48, 47, 49, 50, 51],
  ];
  for (let index = 0; index < items.length; index += 1) {
    for (let day = 0; day < priceValues[index].length; day += 1) {
      const timestamp = new Date(Date.now() - (priceValues[index].length - day) * 86400000);
      await PriceHistory.findOneAndUpdate(
        { itemId: items[index]._id, district: 'Hassan', timestamp },
        { $set: { price: priceValues[index][day], source: 'GRAFA demo data' } },
        { upsert: true, new: true }
      );
    }
  }

  const cropSeeds = [
    {
      cropName: 'Tomato', cropFamily: 'Solanaceae', season: ['Kharif', 'Rabi'],
      description: 'Warm-season vegetable suited to well-drained soil and regular irrigation.',
      avgYield: 24000, waterRequirement: 600, soilType: ['Loamy', 'Sandy loam'],
      tempRange: { min: 18, max: 30 }, harvestDays: 90,
      districtAvailability: ['Hassan'], culturalPractices: 'Stake plants, mulch the root zone, and scout weekly for blight.',
      commonDiseases: [{ name: 'Early blight', symptoms: ['Brown leaf spots', 'Leaf yellowing'], treatment: 'Remove affected leaves and apply an approved fungicide.', severity: 'medium' }],
    },
    {
      cropName: 'Ragi', cropFamily: 'Poaceae', season: ['Kharif'],
      description: 'Drought-tolerant millet with strong performance in light to medium soils.',
      avgYield: 1800, waterRequirement: 450, soilType: ['Red soil', 'Loamy'],
      tempRange: { min: 20, max: 32 }, harvestDays: 110,
      districtAvailability: ['Hassan'], culturalPractices: 'Use line sowing, maintain weed-free rows, and harvest when ears turn brown.',
      commonDiseases: [{ name: 'Finger millet blast', symptoms: ['Neck lesions', 'Ear drying'], treatment: 'Use resistant seed and improve field airflow.', severity: 'high' }],
    },
    {
      cropName: 'Paddy', cropFamily: 'Poaceae', season: ['Kharif'],
      description: 'Rice crop profile for irrigated and rain-supported farms in Hassan district.',
      avgYield: 4200, waterRequirement: 1200, soilType: ['Clay loam', 'Alluvial'],
      tempRange: { min: 21, max: 35 }, harvestDays: 125,
      districtAvailability: ['Hassan'], culturalPractices: 'Use certified seed, level the field, and follow alternate wetting and drying where possible.',
      commonDiseases: [{ name: 'Bacterial leaf blight', symptoms: ['Water-soaked leaf edges', 'Leaf drying'], treatment: 'Avoid excess nitrogen and use clean irrigation water.', severity: 'high' }],
    },
  ];

  for (const cropSeed of cropSeeds) {
    await CropDetails.findOneAndUpdate(
      { cropName: cropSeed.cropName },
      { $set: { ...cropSeed, approvedBy: admin._id, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await Ad.findOneAndUpdate(
    { userId: user._id, title: 'Fresh Hassan tomatoes available' },
    {
      $set: {
        description: 'Quality tomatoes harvested this week. Contact the seller for bulk orders.',
        district: 'Hassan',
        category: 'Produce',
        shopLocation: 'Hassan APMC Market',
        contactPhone: '9999999999',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(JSON.stringify({
    message: 'GRAFA test data seeded',
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    userDeviceId: USER_DEVICE_ID,
    district: 'Hassan',
    items: items.map(item => item.name),
    crops: cropSeeds.map(crop => crop.cropName),
  }, null, 2));
}

seed()
  .catch(error => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
