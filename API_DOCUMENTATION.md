# GRAFA API Documentation

## Base URL
```
https://api.grafa.com/api
```

---

## Authentication

All requests (except `/auth/register` and `/auth/login`) require JWT token in header:

```
Authorization: Bearer <jwt_token>
```

---

## CROPS MANAGEMENT

### Get All Crops
```http
GET /crops?season=Kharif&district=Mumbai&search=Rice&page=1&limit=20
```

**Query Parameters:**
- `season` (string): Filter by season (Kharif, Rabi, Zaid)
- `district` (string): Filter by district
- `search` (string): Search by crop name or description
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "crops": [
    {
      "_id": "crop-id",
      "cropName": "Rice",
      "cropFamily": "Poaceae",
      "season": ["Kharif"],
      "imageUrl": "https://...",
      "avgYield": 5000,
      "waterRequirement": 600,
      "soilType": ["Loamy"],
      "tempRange": { "min": 20, "max": 30 },
      "harvestDays": 120,
      "priceUnit": "per kg",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Crop Details
```http
GET /crops/:id
```

**Response:**
```json
{
  "crop": { ...crop details... },
  "priceHistory": [ ...last 7 prices... ],
  "districtPrices": [
    {
      "_id": "Mumbai",
      "avgPrice": 1850,
      "minPrice": 1800,
      "maxPrice": 1900,
      "count": 30
    }
  ]
}
```

### Add New Crop (Admin Only)
```http
POST /crops
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "cropName": "Rice",
  "cropFamily": "Poaceae",
  "season": ["Kharif", "Rabi"],
  "imageUrl": "https://...",
  "description": "...",
  "avgYield": 5000,
  "waterRequirement": 600,
  "soilType": ["Loamy", "Clay"],
  "tempRange": { "min": 20, "max": 30 },
  "harvestDays": 120,
  "districtAvailability": ["Mumbai", "Pune"]
}
```

### Get Crops by Season
```http
GET /crops/seasonal/:season?district=Mumbai
```

**Response:**
```json
{
  "season": "Kharif",
  "crops": [ ...crops... ]
}
```

---

## WEATHER DATA

### Get Current Weather
```http
GET /weather/:district/current
```

**Response:**
```json
{
  "district": "Mumbai",
  "date": "2024-01-15",
  "temperature": {
    "min": 20,
    "max": 32,
    "avg": 26
  },
  "humidity": 75,
  "rainfall": 2.5,
  "windSpeed": 15,
  "soilMoisture": 65,
  "condition": "Partly Cloudy",
  "uvIndex": 6
}
```

### Get 7-Day Forecast
```http
GET /weather/:district/forecast
```

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "tempMin": 20,
    "tempMax": 32,
    "condition": "Sunny",
    "rainfall": 0
  },
  ...
]
```

### Add Weather Data (Admin Only)
```http
POST /weather
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "district": "Mumbai",
  "date": "2024-01-15",
  "temperature": { "min": 20, "max": 32, "avg": 26 },
  "humidity": 75,
  "rainfall": 2.5,
  "windSpeed": 15,
  "soilMoisture": 65,
  "condition": "Partly Cloudy",
  "uvIndex": 6,
  "forecast7Day": [
    { "date": "2024-01-15", "tempMin": 20, "tempMax": 32, "condition": "Sunny", "rainfall": 0 }
  ]
}
```

### Bulk Upload Weather Data (Admin Only)
```http
POST /weather/bulk
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "data": [
    { "district": "Mumbai", "date": "2024-01-15", ... },
    { "district": "Pune", "date": "2024-01-15", ... }
  ]
}
```

### Get Weather History
```http
GET /weather/:district/history?days=30
```

**Response:**
```json
{
  "district": "Mumbai",
  "days": 30,
  "data": [ ...weather data... ],
  "trends": {
    "avgTemp": 26.5,
    "totalRainfall": 45.2,
    "avgHumidity": 72.3
  }
}
```

---

## FARM PROFILE

### Get Farm Profile
```http
GET /farm/profile
Authorization: Bearer <user-token>
```

### Create/Update Farm Profile
```http
POST /farm/profile
Content-Type: application/json
Authorization: Bearer <user-token>

{
  "farmName": "Green Valley Farm",
  "location": {
    "coordinates": {
      "type": "Point",
      "coordinates": [72.8, 19.0]
    },
    "district": "Mumbai",
    "village": "XYZ village",
    "state": "Maharashtra"
  },
  "areaInHectares": 5,
  "soilType": "Loamy",
  "irrigationType": "Drip",
  "yearsOfFarming": 10,
  "certifications": ["Organic"]
}
```

### Add Crop to Farm
```http
POST /farm/crops
Authorization: Bearer <user-token>

{
  "cropId": "crop-id",
  "season": "Kharif",
  "areaInHectares": 2,
  "plantingDate": "2024-06-01",
  "expectedHarvestDate": "2024-10-01"
}
```

### Get Farmers by District
```http
GET /farm/district/:district?verified=true&limit=20&page=1
```

### Get Nearby Farmers (Geospatial)
```http
GET /farm/nearby?lat=19.0&long=72.8&maxDistance=50000
```

---

## PRICE ALERTS

### Create Price Alert
```http
POST /alerts/subscribe
Authorization: Bearer <user-token>

{
  "cropId": "crop-id",
  "district": "Mumbai",
  "alertType": "PRICE_DROP",
  "targetPrice": 1800,
  "triggerThreshold": 10
}
```

**Alert Types:**
- `PRICE_DROP`: Alert when price drops below target
- `PRICE_SPIKE`: Alert when price goes above target
- `TARGET_ACHIEVED`: Alert when price reaches target
- `MARKET_TREND`: Alert on market trends

### Get User's Alerts
```http
GET /alerts?status=active&page=1&limit=20
Authorization: Bearer <user-token>
```

### Update Alert Status
```http
PATCH /alerts/:id/status
Authorization: Bearer <user-token>

{
  "status": "dismissed",
  "reason": "Price already dropped"
}
```

### Trigger Alerts (Admin Only - Scheduled)
```http
POST /alerts/trigger
Authorization: Bearer <admin-token>
```

---

## DISEASES

### Get All Diseases
```http
GET /diseases?crop=crop-id&severity=MODERATE&season=Kharif&limit=20
```

### Get Disease Details
```http
GET /diseases/:id
```

**Response:**
```json
{
  "_id": "disease-id",
  "diseaseName": "Leaf Blast",
  "cropAffected": {
    "_id": "crop-id",
    "cropName": "Rice"
  },
  "symptoms": ["Brown spots on leaves", "White centers"],
  "treatment": "Apply fungicide spray",
  "preventiveMeasures": [
    "Remove affected leaves",
    "Improve drainage",
    "Reduce nitrogen"
  ],
  "pesticides": [
    {
      "name": "Propiconazole",
      "dosage": "1 ML/L",
      "concentration": "25% EC",
      "daysTillHarvest": 14
    }
  ],
  "organicAlternatives": ["Neem oil", "Sulfur dust"],
  "severity": "MODERATE",
  "seasonalOccurrence": ["Kharif"],
  "imageUrl": "https://..."
}
```

### Search Diseases
```http
GET /diseases/search?q=rust&limit=20
```

### Add Disease (Admin Only)
```http
POST /diseases
Authorization: Bearer <admin-token>

{
  "diseaseName": "Leaf Blast",
  "cropAffected": "crop-id",
  "symptoms": ["Brown spots", "White centers"],
  "treatment": "Apply fungicide",
  "preventiveMeasures": [...],
  "pesticides": [...],
  "organicAlternatives": [...],
  "imageUrl": "https://...",
  "severity": "MODERATE",
  "seasonalOccurrence": ["Kharif"],
  "affectedStages": ["Vegetative"],
  "weatherConditions": {
    "idealTemperature": { "min": 25, "max": 30 },
    "idealHumidity": "High",
    "rainfall": "Moderate"
  }
}
```

### Get Diseases by Season
```http
GET /diseases/season/:season?limit=20
```

### Bulk Add Diseases (Admin Only)
```http
POST /diseases/bulk
Authorization: Bearer <admin-token>

{
  "diseases": [ ...array of disease objects... ]
}
```

---

## NOTIFICATIONS

### Get Notifications
```http
GET /notifications?isRead=false&type=PRICE_ALERT&page=1&limit=20
Authorization: Bearer <user-token>
```

### Mark as Read
```http
PATCH /notifications/:id/read
Authorization: Bearer <user-token>
```

### Mark All as Read
```http
PATCH /notifications/read-all
Authorization: Bearer <user-token>
```

### Get Unread Count
```http
GET /notifications/count/unread
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "unreadCount": 5
}
```

### Send Notification (Admin Only)
```http
POST /notifications/send
Authorization: Bearer <admin-token>

{
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Price Update",
  "message": "Rice price in your district has increased",
  "type": "PRICE_ALERT",
  "data": {
    "cropId": "crop-id",
    "cropName": "Rice",
    "price": 1850,
    "district": "Mumbai"
  }
}
```

### Broadcast Notification (Admin Only)
```http
POST /notifications/broadcast
Authorization: Bearer <admin-token>

{
  "title": "Weather Alert",
  "message": "Heavy rain expected tomorrow",
  "type": "WEATHER_WARNING",
  "filter": { "location.district": "Mumbai" }
}
```

---

## ERROR RESPONSES

All errors follow this format:

```json
{
  "error": "Error message description",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common Status Codes:**
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## RATE LIMITING

- **General API**: 100 requests per 15 minutes
- **Authentication**: 50 requests per minute
- **Admin Operations**: 200 requests per 15 minutes

**Rate limit headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## PAGINATION

Standard pagination format:

```query
?page=1&limit=20
```

**Response header includes:**
```json
"pagination": {
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

## WEBHOOKS (Future)

Subscribe to webhooks for real-time events:

```http
POST /webhooks/subscribe
Authorization: Bearer <token>

{
  "event": "price.updated",
  "webhookUrl": "https://your-domain.com/webhooks/prices",
  "active": true
}
```

**Events:**
- `price.updated`: When crop price is updated
- `weather.updated`: When weather data changes
- `disease.new`: When new disease alert is published
- `alert.triggered`: When user alert is triggered

---

## CODE EXAMPLES

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.grafa.com/api',
  timeout: 5000,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get crops
const crops = await api.get('/crops?season=Kharif&limit=10');

// Create alert
const alert = await api.post('/alerts/subscribe', {
  cropId: 'rice-123',
  district: 'Mumbai',
  alertType: 'PRICE_DROP',
  targetPrice: 1800
});
```

### Python
```python
import requests

API_URL = 'https://api.grafa.com/api'
headers = {'Authorization': f'Bearer {token}'}

# Get crops
response = requests.get(f'{API_URL}/crops', 
  params={'season': 'Kharif'},
  headers=headers
)
crops = response.json()

# Get weather
weather = requests.get(f'{API_URL}/weather/Mumbai/current',
  headers=headers
).json()
```

### cURL
```bash
# Get crops
curl -H "Authorization: Bearer $token" \
  "https://api.grafa.com/api/crops?season=Kharif"

# Create alert
curl -X POST \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "rice-123",
    "district": "Mumbai",
    "alertType": "PRICE_DROP",
    "targetPrice": 1800
  }' \
  "https://api.grafa.com/api/alerts/subscribe"
```

