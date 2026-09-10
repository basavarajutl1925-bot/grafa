require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Ad = require('../src/models/Ad');
const PriceHistory = require('../src/models/PriceHistory');

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
