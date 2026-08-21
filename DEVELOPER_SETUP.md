# GRAFA - Developer Setup Guide

## Quick Start (5 minutes)

```bash
# Clone repository
git clone https://github.com/basavaraju/grafa.git
cd grafa

# Backend setup
cd backend
npm install
echo "MONGODB_URI=mongodb://localhost:27017/grafa
JWT_SECRET=dev-secret-key
PORT=5000
NODE_ENV=development" > .env
npm run dev

# In another terminal, Mobile setup
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
expo start

# In another terminal, Admin Web
cd admin-web
# Simply open dashboard.html in browser or serve with:
npx serve
```

---

## Prerequisites

### System Requirements
- Node.js v14+ (Recommended: v16 or v18)
- npm v6+ or yarn
- Git
- MongoDB (local or Atlas)
- Android SDK (for APK building)

### Installation

#### macOS
```bash
# Using Homebrew
brew install node
brew install mongodb-community
brew install git

# Start MongoDB
brew services start mongodb-community

# Install Expo CLI
npm install -g expo-cli
```

#### Ubuntu/Debian
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y npm

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Expo CLI
sudo npm install -g expo-cli
```

#### Windows
```bash
# Using Chocolatey (recommended)
choco install nodejs
choco install mongodb
choco install git

# Or download from official websites:
# Node.js: https://nodejs.org
# MongoDB: https://www.mongodb.com/try/download/community
# Git: https://git-scm.com

# After installation, verify
node --version
npm --version
mongo --version
```

---

## Backend Setup

### Configuration

```bash
cd backend
npm install
```

Create `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/grafa
DB_NAME=grafa

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=development

# Optional: Firebase (for notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
```

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm run start

# Testing
npm test

# Check code quality
npm run lint
```

### API Testing

```bash
# Health check
curl http://localhost:5000/health

# Get crops
curl http://localhost:5000/api/crops

# Create crop (requires admin token)
curl -X POST http://localhost:5000/api/crops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"cropName":"Rice", "season":["Kharif"]}'
```

### Database Setup

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/grafa

# Create indexes manually (optional, auto-created on first use)
db.crops.createIndex({ cropName: 1 });
db.crops.createIndex({ season: 1 });
db.weather.createIndex({ district: 1, date: -1 });
db.priceHistory.createIndex({ itemId: 1, timestamp: -1 });
db.farmProfile.createIndex({ "location.coordinates": "2dsphere" });

# Verify collections
show collections
```

---

## Mobile Setup

### Using Expo (Easiest for Development)

```bash
cd mobile

# Install dependencies
npm install

# Start development server
expo start

# Options will appear:
# Press 'a' to open Android emulator
# Press 'i' to open iOS simulator
# Press 'w' to open web preview
# Press 'j' to open debugger
# Press 'r' to reload
```

### Android Emulator Setup

```bash
# Install Android SDK if not already done
# Open Android Studio -> SDK Manager -> Install Android SDK

# Create emulator
$ANDROID_HOME/tools/bin/avdmanager create avd -n grafa-emulator -k "system-images;android-33;google_apis;x86_64"

# Start emulator
$ANDROID_HOME/emulator/emulator -avd grafa-emulator &

# Reload Expo to detect emulator
# In Expo terminal, press 'a'
```

### Configure API Endpoint

Create `.env.local`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
# Use your machine IP, not localhost (since running on emulator)
# Find IP: Windows: ipconfig | macOS: ifconfig
```

### Development Commands

```bash
cd mobile

# Start with specific platform
expo start --android
expo start --ios
expo start --web

# Build APK (requires EAS)
eas build --platform android --type apk

# Eject from Expo (one-way operation)
expo eject

# Run tests
npm test

# Lint code
npm run lint
```

---

## Admin Web Panel

### Local Development

```bash
cd admin-web

# Option 1: Direct file access
# Just open dashboard.html in browser

# Option 2: Simple HTTP server
npx serve
# Access at http://localhost:3000

# Option 3: Python HTTP server
python -m http.server 8000
# Access at http://localhost:8000
```

### Building React App (if extended)

```bash
# Create new React app
npx create-react-app admin-panel

# Install dependencies
npm install axios antd chart.js react-chartjs-2

# Start development
npm start

# Build for production
npm run build
```

### Connecting to Backend

Update API calls in dashboard.html:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

async function getCrops() {
  const response = await fetch(`${API_BASE_URL}/crops`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

---

## Project Structure Overview

```
grafa/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Main entry point
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── CropDetails.js       # New
│   │   │   ├── WeatherData.js       # New
│   │   │   ├── FarmProfile.js       # New
│   │   │   ├── PriceHistory.js
│   │   │   ├── PriceAlert.js        # New
│   │   │   ├── CropDisease.js       # New
│   │   │   └── Notification.js      # New
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── crops.js             # New
│   │   │   ├── weather.js           # New
│   │   │   ├── farm.js              # New
│   │   │   ├── alerts.js            # New
│   │   │   ├── diseases.js          # New
│   │   │   ├── notifications.js     # New
│   │   │   ├── admin.js
│   │   │   ├── ads.js
│   │   │   └── items.js
│   │   └── utils/
│   ├── .env                          # Configuration
│   ├── package.json
│   ├── docker-compose.yml            # Docker setup
│   └── Dockerfile
│
├── mobile/
│   ├── src/
│   │   ├── App.js
│   │   ├── screens/
│   │   │   ├── CropDetailsScreen.js  # New
│   │   │   ├── DiseaseIdentificationScreen.js # New
│   │   │   ├── PricePredictionScreen.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── PostAdScreen.js
│   │   │   └── AdFeed.js
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.js
│   │   └── components/
│   ├── .env.local
│   ├── package.json
│   ├── app.json
│   └── metro.config.js
│
├── admin-web/
│   ├── dashboard.html               # Main admin interface (New)
│   └── styles.css
│
├── API_DOCUMENTATION.md             # API endpoints (New)
├── BUILD_AND_DEPLOYMENT_GUIDE.md    # Build guide (New)
├── PRODUCT_ANALYSIS.md              # Product roadmap (New)
├── ARCHITECTURE.md
├── README.md
└── docker-compose.yml               # Full stack docker
```

---

## Common Development Tasks

### Add a New Crop

```bash
# Use API directly
curl -X POST http://localhost:5000/api/crops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "cropName": "Wheat",
    "season": ["Rabi"],
    "avgYield": 3500,
    "waterRequirement": 400
  }'
```

### Add Weather Data

```bash
curl -X POST http://localhost:5000/api/weather \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "district": "Mumbai",
    "date": "2024-01-15",
    "temperature": {"min": 20, "max": 32},
    "humidity": 75,
    "rainfall": 2.5
  }'
```

### Test Price Alert

```bash
# Create alert
curl -X POST http://localhost:5000/api/alerts/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "cropId": "rice-id",
    "district": "Mumbai",
    "alertType": "PRICE_DROP",
    "targetPrice": 1800
  }'

# Trigger alerts
curl -X POST http://localhost:5000/api/alerts/trigger \
  -H "Authorization: Bearer <admin-token>"
```

### Create Admin User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grafa.com",
    "password": "secure-password",
    "role": "admin",
    "deviceId": "device-123"
  }'
```

---

## Debugging Tips

### Backend Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Use Node debugger
node --inspect src/server.js

# Then open chrome://inspect in Chrome
```

### Mobile App Debugging

```bash
# Enable Redux dev tools
npm install redux-devtools-extension

# Use React Native Debugger
# Download from: https://github.com/jhen0409/react-native-debugger

# View logs
expo logs

# Clear cache
expo start --clear
```

### Database Debugging

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/grafa

# View collections
db.crops.find().pretty()
db.weather.find().pretty()

# Check indexes
db.crops.getIndexes()

# Drop collection (careful!)
db.crops.drop()

# Backup
mongodump --uri "mongodb://localhost:27017/grafa" --out ./backup
```

---

## Useful Tools

### API Testing
- **Postman**: https://www.postman.com
- **Insomnia**: https://insomnia.rest
- **Thunder Client**: VS Code extension

### Database Tools
- **MongoDB Compass**: https://www.mongodb.com/products/compass
- **Robo 3T**: https://robomongo.org
- **MongoDB CLI**: Part of MongoDB tools

### Code Editors
- **VS Code**: https://code.visualstudio.com
- **WebStorm**: https://www.jetbrains.com/webstorm
- **Android Studio**: For mobile development

### Version Control
```bash
# Clone repo
git clone https://github.com/basavaraju/grafa.git

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

---

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB (if not running)
sudo systemctl start mongod
# or
brew services start mongodb-community

# Test connection
mongo mongodb://localhost:27017/grafa
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
# or Windows:
netstat -ano | findstr :5000

# Kill process
kill -9 <PID>
# or on Windows:
taskkill /PID <PID> /F
```

### Expo Connection Issues

```bash
# Clear cache
rm -rf node_modules expo/.
npm install
expo start --clear

# Reset Metro bundler
expo start --clear --reset-cache

# Check firewall (especially for emulator)
# Allow Node.js through firewall
```

### Mobile App Not Connecting to Backend

```bash
# Find local machine IP
# macOS/Linux: ifconfig
# Windows: ipconfig

# Update .env.local with correct IP:
EXPO_PUBLIC_API_URL=http://192.168.X.X:5000/api

# Make sure backend is accessible from emulator
# Test: curl http://192.168.X.X:5000/health
```

---

## Performance Optimization

### Database Optimization

```bash
# Create indexes for frequently queried fields
db.crops.createIndex({ cropName: 1 })
db.weather.createIndex({ district: 1, date: -1 })
db.priceHistory.createIndex({ itemId: 1, timestamp: -1 })

# Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find({ millis: { $gt: 100 } }).count()
```

### API Performance

```javascript
// Use pagination for large results
GET /api/crops?page=1&limit=20

// Add caching
const redis = require('redis');
const client = redis.createClient();

app.get('/api/crops', async (req, res) => {
  const cached = await client.get('crops');
  if (cached) return res.json(JSON.parse(cached));
  
  const crops = await Crop.find();
  await client.setex('crops', 3600, JSON.stringify(crops));
  res.json(crops);
});
```

### Frontend Optimization

```javascript
// Implement lazy loading
import React, { Suspense } from 'react';
const CropDetails = React.lazy(() => import('./CropDetailsScreen'));

// Use FlatList for large lists (React Native)
<FlatList
  data={crops}
  renderItem={renderCrop}
  keyExtractor={item => item._id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## Next Steps

1. **Setup environment** following this guide
2. **Run backend** on `http://localhost:5000`
3. **Start mobile app** with `expo start`
4. **Open admin panel** at `http://localhost:8000`
5. **Read API documentation** in `API_DOCUMENTATION.md`
6. **Follow deployment guide** in `BUILD_AND_DEPLOYMENT_GUIDE.md`

For issues or questions:
- Check GitHub issues: https://github.com/basavaraju/grafa/issues
- Read documentation: https://docs.grafa.app
- Contact team: support@grafa.com

