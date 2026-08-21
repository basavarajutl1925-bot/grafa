# Architecture Overview - Grafa

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (React Native)               │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Ad Feed      │ Post Ad      │ Price Predictions       │ │
│  │ Screen       │ Screen       │ Admin Dashboard         │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Services Layer                                           │ │
│  │ ├─ Authentication (Device-based + JWT)                  │ │
│  │ ├─ Geolocation Tracking                                │ │
│  │ ├─ API Client (Axios)                                   │ │
│  │ └─ Local Storage (AsyncStorage)                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                  Nginx Load Balancer (Port 80/443)           │
│  ├─ Rate Limiting                                            │
│  ├─ SSL/TLS Termination                                      │
│  ├─ Request Routing                                          │
│  └─ Gzip Compression                                         │
└──────────────────────────────────────────────────────────────┘
              ↓                    ↓                    ↓
     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
     │ API Instance │    │ API Instance │    │ API Instance │
     │     #1       │    │     #2       │    │     #3       │
     │ (Node.js)    │    │ (Node.js)    │    │ (Node.js)    │
     │ Port 5001    │    │ Port 5002    │    │ Port 5003    │
     └──────────────┘    └──────────────┘    └──────────────┘
              ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                 Shared Data Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MongoDB Database (Scalable, Replicated)                │ │
│  │ ├─ Users Collection (Device-based, District)          │ │
│  │ ├─ Ads Collection (Location-indexed)                  │ │
│  │ ├─ Items Collection (Price tracking)                  │ │
│  │ ├─ PriceHistory Collection (Time-series)              │ │
│  │ └─ TTL Indexes for Auto-cleanup                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Redis Cache (Optional)                                 │ │
│  │ ├─ Ad Feed Cache                                       │ │
│  │ ├─ Rate Limiting Store                                │ │
│  │ └─ Session Cache                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Authentication Flow

```
Mobile App
    ↓
[Device ID + GPS Coords]
    ↓
Backend: POST /api/auth/user/login
    ├─ Create/Update User with Device ID
    ├─ Store Location (Latitude, Longitude)
    ├─ Generate JWT Token
    └─ Return Token
    ↓
Mobile App stores token in AsyncStorage
```

### 2. Location-Based Ad System

```
User Location (GPS)
    ↓
Detect District (from coordinates)
    ├─ Find nearest district center
    └─ Return district name
    ↓
Query MongoDB for ads in district
    ├─ Filter by status: "active"
    ├─ Use index on (district, status)
    └─ Return max 100 ads
    ↓
Display in Ad Feed
    ├─ Track impressions (view events)
    └─ Track clicks (user interactions)
```

### 3. Ad Posting Workflow

```
User submits ad form
    ├─ Title, Description, Contact Info
    └─ Auto-detect district from GPS
    ↓
API: POST /api/ads/request
    ├─ Create Ad with status: "pending"
    ├─ Set expiry (30 days)
    └─ Notify admin
    ↓
Admin reviews pending ads
    ├─ GET /api/admin/ads/pending
    ├─ Approve or Reject
    └─ Update status to "active" or "rejected"
    ↓
Users see approved ads in feed
```

### 4. Price Prediction System

```
Admin adds item (e.g., "Tomato")
    ├─ Create Item document
    └─ Set unit (kg, liter, etc)
    ↓
Admin uploads price history
    ├─ Single: POST /api/items/{itemId}/price
    ├─ Bulk: POST /api/items/bulk/prices
    └─ Store in PriceHistory collection
    ↓
Machine Learning Model
    ├─ Fetch historical prices (last 90 days)
    ├─ Apply Linear Regression
    ├─ Calculate statistics
    └─ Generate prediction
    ↓
User requests prediction
    ├─ GET /api/items/{itemId}/predict
    ├─ Return predicted price + confidence
    └─ Display in UI
```

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  email: String,           // For admin only
  password: String,        // Hashed
  role: "admin" | "user",
  deviceId: String,        // For normal users
  district: String,
  latitude: Number,
  longitude: Number,
  lastLocationUpdate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Ad Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  title: String,
  description: String,
  district: String,        // Index for queries
  latitude: Number,
  longitude: Number,
  shopLocation: String,
  status: "pending|approved|rejected|active|expired",
  category: String,
  images: [String],
  contactPhone: String,
  contactEmail: String,
  impressions: Number,     // View count
  clicks: Number,          // Click count
  expiresAt: Date,         // TTL index
  createdAt: Date,
  updatedAt: Date
}
```

### Item Schema
```javascript
{
  _id: ObjectId,
  name: String,            // Index for search
  category: String,
  unit: String,            // kg, liter, etc
  description: String,
  addedBy: ObjectId,       // Admin reference
  districts: [String],     // Available in districts
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### PriceHistory Schema
```javascript
{
  _id: ObjectId,
  itemId: ObjectId,        // Indexed
  price: Number,
  district: String,
  source: String,
  timestamp: Date,         // Indexed (descending)
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/admin/register` - Admin registration
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/user/login` - User login (device-based)
- `POST /api/auth/location/update` - Update user location

### Ads (User)
- `GET /api/ads/feed?district=X` - Get ads for district
- `POST /api/ads/request` - Post ad request
- `GET /api/ads/my-ads` - User's ads
- `POST /api/ads/{id}/view` - Track view
- `POST /api/ads/{id}/click` - Track click

### Items & Prediction
- `GET /api/items` - List items
- `POST /api/items` - Create item (admin)
- `POST /api/items/{id}/price` - Add price (admin)
- `POST /api/items/bulk/prices` - Bulk import (admin)
- `GET /api/items/{id}/predict` - Get prediction
- `GET /api/items/{id}/prices` - Price history

### Admin
- `GET /api/admin/ads/pending` - Pending ads
- `POST /api/admin/ads/{id}/approve` - Approve ad
- `POST /api/admin/ads/{id}/reject` - Reject ad
- `POST /api/admin/ads/bulk/approve` - Bulk approve
- `GET /api/admin/dashboard/stats` - Dashboard stats

### Location
- `POST /api/location/district` - Get district from coords
- `GET /api/location/districts` - List all districts

## Database Indexes

```javascript
// Ads Collection
db.ads.createIndex({ district: 1, status: 1 })
db.ads.createIndex({ userId: 1 })
db.ads.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Price History Collection
db.pricehistories.createIndex({ itemId: 1, timestamp: -1 })
db.pricehistories.createIndex({ itemId: 1 })

// Users Collection
db.users.createIndex({ deviceId: 1 }, { unique: true })

// Items Collection
db.items.createIndex({ name: 1 }, { unique: true })
```

## Scalability Features

### Horizontal Scaling
- **Multiple API Instances**: 3-N replicas behind Nginx
- **Connection Pooling**: 10 max connections per MongoDB
- **Load Balancing**: Least connections algorithm

### Rate Limiting
- **General**: 100 req/15 min
- **Auth**: 50 req/min
- **Bulk**: 20 req/min

### Database Optimization
- **Lean Queries**: Return only required fields
- **Batch Operations**: Bulk insert/update
- **Pagination**: Limit result sets
- **Caching**: Redis for frequently accessed data

### High-Concurrency Support (1500+ users)
1. **Connection Pool**: Managed by Mongoose
2. **Request Buffering**: Nginx handles queue
3. **Auto-scaling**: Kubernetes can scale pods
4. **Database Replicas**: MongoDB replication
5. **Caching Layer**: Redis cache for hot data

## Performance Targets

| Metric | Target |
|--------|--------|
| Ad Feed Load | < 500ms |
| Price Prediction | < 1000ms |
| API Response (p95) | < 200ms |
| Throughput | 5000+ req/sec |
| Concurrent Users | 1500+ |
| Error Rate | < 0.1% |
| Uptime | 99.5% |

## Deployment Options

### 1. Docker Compose (Development/Testing)
```bash
docker-compose up -d
```

### 2. Kubernetes (Production)
```bash
kubectl apply -f deployment.yaml
kubectl scale deployment grafa-api --replicas=5
```

### 3. AWS
- ECS/Fargate for containers
- RDS for MongoDB
- ALB for load balancing
- CloudFront for CDN

### 4. On-Premise
- Docker Swarm or Kubernetes
- MongoDB on separate servers
- Nginx reverse proxy
- PM2 for process management

## Monitoring & Logging

### Key Metrics
- Request latency (p50, p95, p99)
- Error rate
- Throughput (req/sec)
- Database query time
- Memory usage
- Connection pool status

### Logging
- Application logs: Winston/Bunyan
- Access logs: Nginx
- Database logs: MongoDB
- Error tracking: Sentry/LogRocket

## Security

- **Authentication**: JWT tokens (7-30 day expiry)
- **Password**: bcrypt hashing
- **Rate Limiting**: Prevent brute force
- **HTTPS**: SSL/TLS encryption
- **CORS**: Configured for mobile apps
- **Headers**: Helmet.js security headers
- **Input Validation**: Joi schema validation

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis (optional)
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: bcryptjs, Helmet.js

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Geolocation**: react-native-geolocation-service
- **UUID**: react-native-uuid

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **Load Balancing**: Nginx
- **CDN**: CloudFront (optional)
- **Monitoring**: Prometheus + Grafana (optional)

## Future Enhancements

1. **Real-time Features**: WebSocket for live notifications
2. **Advanced Analytics**: Detailed ad performance dashboards
3. **Machine Learning**: ARIMA for better price predictions
4. **Payment Integration**: For premium ad listings
5. **Multi-language**: Support regional languages
6. **Image Optimization**: CDN for ad images
7. **Mobile Notifications**: Push notifications for matching ads
8. **Review System**: User ratings for businesses

## References

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Performance](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [React Native Architecture](https://reactnative.dev/docs/architecture-overview)
- [nginx Configuration](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
