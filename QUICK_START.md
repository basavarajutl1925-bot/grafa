# Quick Start Guide - Grafa

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Docker (optional, for easy setup)

## Option 1: Docker (Recommended - Easiest)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to start (about 30 seconds)
docker-compose ps

# Verify services are running
curl http://localhost/health

# Stop services
docker-compose down
```

This starts:
- MongoDB on port 27017
- 3 API instances (ports 5001-5003)
- Nginx load balancer on port 80
- Redis cache on port 6379

## Option 2: Local Development Setup

### 1. Install Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Server will run on http://localhost:5000

### 2. Install Mobile App

```bash
cd ../mobile
npm install

# For Android
npm run android

# For iOS
npm run ios
```

### 3. Test the API

```bash
# Check if server is running
curl http://localhost:5000/health

# List all available districts
curl http://localhost:5000/api/location/districts

# Get items (should be empty initially)
curl http://localhost:5000/api/items
```

## First-Time Admin Setup

### 1. Register Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grafa.com",
    "password": "admin123"
  }'
```

Save the returned token.

### 2. Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grafa.com",
    "password": "admin123"
  }'
```

### 3. Add Items for Price Tracking

```bash
ADMIN_TOKEN="your-token-from-login"

curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Tomato",
    "category": "Vegetable",
    "unit": "kg",
    "description": "Fresh tomatoes"
  }'
```

## User Flow

### 1. User Login (Device-based)

```bash
curl -X POST http://localhost:5000/api/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-abc123",
    "latitude": 13.203,
    "longitude": 75.9239
  }'
```

Note the returned token.

### 2. Get District

```bash
curl -X POST http://localhost:5000/api/location/district \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.203,
    "longitude": 75.9239
  }'
```

### 3. View Ads

```bash
USER_TOKEN="token-from-login"

curl http://localhost:5000/api/ads/feed?district=Hassan \
  -H "Authorization: Bearer $USER_TOKEN"
```

### 4. Post Ad

```bash
curl -X POST http://localhost:5000/api/ads/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "title": "Fresh Vegetables",
    "description": "Daily farm fresh",
    "district": "Hassan",
    "category": "Retail",
    "shopLocation": "Main Market",
    "contactPhone": "9876543210",
    "contactEmail": "shop@example.com"
  }'
```

### 5. Get Price Predictions

First, add some price data as admin:

```bash
ITEM_ID="id-from-item-creation"

curl -X POST http://localhost:5000/api/items/$ITEM_ID/price \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "price": 45.50,
    "district": "Hassan"
  }'
```

Then get predictions:

```bash
curl "http://localhost:5000/api/items/$ITEM_ID/predict?daysAhead=7&district=Hassan" \
  -H "Authorization: Bearer $USER_TOKEN"
```

## Database Setup (if using local MongoDB)

```bash
# Start MongoDB
mongod

# In another terminal, connect and create indexes
mongo

# In MongoDB shell:
> use grafa
> db.ads.createIndex({ district: 1, status: 1 })
> db.pricehistories.createIndex({ itemId: 1, timestamp: -1 })
> db.users.createIndex({ deviceId: 1 }, { unique: true })
```

## Troubleshooting

### MongoDB connection error
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### CORS errors
- Check backend CORS configuration in `backend/src/server.js`
- Update mobile app API base URL in `mobile/src/services/api.js`

### Docker issues
```bash
# Check logs
docker-compose logs -f api-1

# Rebuild containers
docker-compose build --no-cache

# Full reset
docker-compose down -v
docker-compose up -d
```

## Performance Testing

### Load Test (100 concurrent users)
```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:5000/api/items
```

### Load Test (1500 concurrent users)
```bash
# Using wrk
wrk -t4 -c1500 -d30s http://localhost:5000/api/items
```

## Next Steps

1. **Mobile App**: Configure API endpoint in `mobile/src/services/api.js`
2. **Location Detection**: Test geolocation in mobile app
3. **Load Testing**: Use SCALABILITY.md for production setup
4. **Admin Dashboard**: Access at mobile app Admin tab
5. **Database Optimization**: Check indexes with `db.collection.getIndexes()`

## Useful Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm start              # Start production

# Testing
npm test               # Run tests
npm test -- --coverage # With coverage

# Database
mongosh               # Connect to MongoDB
use grafa              # Switch to grafa database
db.users.find()       # View users
db.ads.find()         # View ads

# Docker
docker-compose ps     # See running services
docker-compose logs   # View logs
docker exec -it grafa-mongodb mongosh  # Access MongoDB in container
```

## File Structure

```
grafa/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── mobile/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Support

For detailed documentation, see:
- `README.md` - Full documentation
- `SCALABILITY.md` - High-concurrency setup
- `AD_SYSTEM_EXAMPLES.md` - Ad system examples
- `PRICE_PREDICTION_EXAMPLES.md` - Price prediction examples
