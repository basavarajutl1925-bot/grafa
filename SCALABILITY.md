# High-Concurrency Implementation Guide

## Handling 1500+ Concurrent Requests

This document outlines strategies for scaling the Grafa application to handle 1500+ simultaneous requests.

## 1. Backend Optimization

### Connection Pooling
```javascript
// Already configured in server.js
const mongoose = require('mongoose');

await mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,  // Connection pool size
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: 'majority'
});
```

### Database Indexes
Create these indexes for optimal performance:

```javascript
// In MongoDB shell or Compass
db.ads.createIndex({ district: 1, status: 1 })
db.ads.createIndex({ userId: 1 })
db.ads.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.pricehistories.createIndex({ itemId: 1, timestamp: -1 })
db.pricehistories.createIndex({ itemId: 1 })
db.users.createIndex({ deviceId: 1, unique: true })
```

### Bulk Operations
```javascript
// Example: Bulk price import
const docs = [];
for (let i = 0; i < 1000; i++) {
  docs.push({
    itemId: ObjectId(...),
    price: Math.random() * 100,
    district: 'Hassan',
    timestamp: new Date()
  });
}

// Insert all at once
await PriceHistory.insertMany(docs, { ordered: false });
```

## 2. API Rate Limiting Configuration

### Current Configuration
```javascript
// General endpoints: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Auth endpoints: 50 requests per 1 minute
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50
});
```

### Advanced Rate Limiting (Redis-based)
```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const redisClient = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'  // rate limit prefix
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
```

## 3. Load Testing

### Using Apache Bench
```bash
# Simple load test
ab -n 1000 -c 100 http://localhost:5000/api/items

# With concurrency ramping
ab -n 1500 -c 1500 http://localhost:5000/api/items
```

### Using Wrk (Better for high concurrency)
```bash
# 4 threads, 1500 connections, 30 second duration
wrk -t4 -c1500 -d30s --script benchmark.lua http://localhost:5000/api/items
```

### Using Artillery
```bash
# Install: npm install -g artillery

# Create config: artillery.yml
scenarios:
  - name: "Ad Feed"
    flow:
      - get:
          url: "/api/ads/feed?district=Hassan"

# Run test
artillery run artillery.yml --target http://localhost:5000
```

### Example Benchmark Script (benchmark.lua)
```lua
request = function()
  return wrk.format(nil, "/api/items")
end

response = function(status, headers, body)
  if status ~= 200 then
    print("Response status: " .. status)
  end
end
```

## 4. Horizontal Scaling with PM2

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'grafa-api',
    script: './src/server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### PM2 Commands
```bash
# Start with clustering
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Scale up/down
pm2 scale grafa-api 8

# Restart
pm2 restart all

# Logs
pm2 logs grafa-api
```

## 5. Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### Docker Compose (for local testing)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_DATABASE: grafa
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/grafa
      JWT_SECRET: dev-secret
    depends_on:
      - mongodb
    deploy:
      replicas: 3

volumes:
  mongo_data:
```

## 6. Nginx Load Balancer Configuration

```nginx
upstream grafa_backend {
    least_conn;  # Least connections strategy
    server localhost:5001 weight=1;
    server localhost:5002 weight=1;
    server localhost:5003 weight=1;
    server localhost:5004 weight=1;
    keepalive 32;
}

server {
    listen 80;
    server_name api.grafa.local;

    location /api/ {
        proxy_pass http://grafa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://grafa_backend;
        access_log off;
    }
}
```

## 7. Database Optimization

### Query Performance
```javascript
// Use lean() for read-only queries
const ads = await Ad.find({ district: 'Hassan' })
  .lean()  // Returns plain objects, 10-50% faster
  .limit(100);

// Use select() to fetch only needed fields
const ads = await Ad.find({})
  .select('title description district')
  .lean();

// Use estimatedDocumentCount() instead of countDocuments()
const count = await Ad.estimatedDocumentCount();
```

### Aggregation Pipeline
```javascript
// Efficient bulk statistics
const stats = await Ad.aggregate([
  { $match: { status: 'active' } },
  { $group: {
      _id: '$district',
      count: { $sum: 1 },
      totalViews: { $sum: '$impressions' }
    }
  },
  { $sort: { count: -1 } }
]);
```

## 8. Monitoring

### Application Monitoring
```javascript
// Add monitoring middleware
const monitoring = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
};
```

### Key Metrics to Monitor
- **Response Time**: p50, p95, p99
- **Throughput**: Requests per second
- **Error Rate**: % of failed requests
- **Database Queries**: Slow query log
- **Memory**: Usage and GC pauses
- **CPU**: Usage by process
- **Connection Pool**: Active/idle connections

## 9. Caching Strategy

### Redis Caching
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache ad feed
const getAdFeed = async (district) => {
  const cacheKey = `feed:${district}`;
  
  // Check cache
  let cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const ads = await Ad.find({ district, status: 'active' }).lean();
  
  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(ads));
  
  return ads;
};
```

## 10. Cost Estimation (AWS)

For 1500 concurrent users:

| Component | Recommended | Cost/Month |
|-----------|------------|------------|
| EC2 Instances (t3.large x 3) | 3-4 | $150 |
| RDS MongoDB (m5.xlarge) | 1 | $300 |
| ElastiCache Redis (cache.t3.micro) | 1 | $30 |
| ALB Load Balancer | 1 | $25 |
| **Total** | | ~$500 |

## Testing Checklist

- [ ] Single instance load test (100-500 concurrent)
- [ ] Multi-instance load test (1000-1500 concurrent)
- [ ] Database failover scenarios
- [ ] Memory leak detection
- [ ] Connection pool saturation
- [ ] Cache invalidation logic
- [ ] Error handling under load
- [ ] Rate limiter effectiveness

## Performance Targets

- Request latency: < 200ms (p95)
- Throughput: 5000+ req/sec
- Error rate: < 0.1%
- Availability: 99.5%

## References

- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Node.js Cluster Module](https://nodejs.org/en/docs/guides/clustering/)
- [Express Rate Limiting](https://github.com/nfriedly/express-rate-limit)
- [PM2 Documentation](https://pm2.keymetrics.io/)
