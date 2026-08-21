# GRAFA - Complete Build & Deployment Guide

## TABLE OF CONTENTS
1. [APK Building (Android)](#apk-building)
2. [Web Application Deployment](#web-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Environment Setup](#environment-setup)
5. [Production Checklist](#production-checklist)

---

## APK Building

### Prerequisites
```bash
# Install Node.js (v14+) and npm
# Install Java Development Kit (JDK 11+)
# Install Android SDK
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Install Expo CLI (Recommended for beginners)
npm install -g eas-cli
npm install -g expo-cli
```

### Method 1: Using EAS Build (Recommended - Easier)

```bash
# Install EAS CLI
npm install -g eas-cli

# Navigate to mobile directory
cd mobile

# Login to Expo account (create account at https://expo.dev)
eas login

# Configure EAS in your project
eas build:configure

# Build for Android (creates APK)
eas build --platform android --type apk

# Build for both APK and AAB
eas build --platform android

# The APK will be available for download from the dashboard
# Download URL will be provided after build completes
```

### Method 2: Local Build Using Gradle

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Create release build
npm run build:android

# Or use Gradle directly
cd android
./gradlew assembleRelease

# Signed APK location:
# android/app/build/outputs/apk/release/app-release.apk

# To create a signed APK (for production):
# 1. Create keystore
keystools -genkey -v -keystore grafa-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias grafa-key

# 2. Add to gradle.properties
echo 'GRAFA_RELEASE_STORE_FILE=grafa-release.keystore' >> android/gradle.properties
echo 'GRAFA_RELEASE_KEY_ALIAS=grafa-key' >> android/gradle.properties
echo 'GRAFA_RELEASE_STORE_PASSWORD=<your-password>' >> android/gradle.properties
echo 'GRAFA_RELEASE_KEY_PASSWORD=<your-password>' >> android/gradle.properties

# 3. Build signed APK
cd android
./gradlew assembleRelease
cd ..
```

### Method 3: Using React Native CLI

```bash
# Initialize React Native project if not using Expo
npx react-native init Grafa --template typescript

# Build APK
cd android
./gradlew assembleRelease
cd ..

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Mobile App Configuration (.env)

Create `.env` file in `mobile/` directory:

```
EXPO_PUBLIC_API_URL=https://your-domain.com/api
EXPO_PUBLIC_APP_NAME=GRAFA
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_FIREBASE_API_KEY=<firebase-key>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
```

### Updated Mobile Package.json

```json
{
  "name": "grafa-mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "build:apk": "eas build --platform android --type apk",
    "build:aab": "eas build --platform android --type app-bundle",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all",
    "publish": "expo publish",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.71.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "react-native-safe-area-context": "^4.4.1",
    "react-native-screens": "^3.20.0",
    "react-native-maps": "^1.3.0",
    "react-native-geolocation-service": "^5.3.0",
    "react-native-push-notification": "^8.1.0",
    "axios": "^1.3.0",
    "redux": "^4.2.0",
    "react-redux": "^8.1.0",
    "realm": "^12.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.71.0",
    "typescript": "^4.9.0"
  }
}
```

---

## Web Deployment

### Admin Web Panel (Standalone HTML)

The admin dashboard is already built as a standalone HTML file at `admin-web/dashboard.html`.

#### Option 1: Deploy to GitHub Pages

```bash
cd admin-web

# Create gh-pages branch
git checkout --orphan gh-pages

# Add files
git add .
git commit -m "Initial admin dashboard"
git push origin gh-pages

# Access at: https://your-username.github.io/grafa/admin-web/
```

#### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to admin-web directory
cd admin-web

# Deploy
netlify deploy --prod --dir .

# Or drag and drop dashboard.html to Netlify's drop zone
```

#### Option 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd admin-web
vercel --prod
```

#### Option 4: Self-hosted (Nginx/Apache)

```bash
# Copy to web server
scp -r admin-web/* user@server:/var/www/grafa-admin/

# Nginx configuration
sudo nano /etc/nginx/sites-available/grafa-admin

# Add this configuration:
server {
    listen 80;
    server_name admin.grafa.com;

    location / {
        root /var/www/grafa-admin;
        try_files $uri /dashboard.html;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/grafa-admin /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### React Admin Panel (Extended Version)

For a full React app:

```bash
# Create React app
npx create-react-app admin-panel
cd admin-panel

# Install dependencies
npm install axios antd chart.js react-chartjs-2 redux react-redux formik yup

# Create .env
echo "REACT_APP_API_URL=https://your-api.com/api" > .env

# Build
npm run build

# Deploy to GitHub Pages
npm install --save-dev gh-pages

# Update package.json
{
  "homepage": "https://your-domain.com/admin",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}

npm run deploy
```

---

## Backend Deployment

### Prerequisites
- Node.js v14+
- MongoDB Atlas or local MongoDB
- Redis (optional, for caching)

### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create grafa-backend

# Add buildpacks
heroku buildpacks:add heroku/nodejs -a grafa-backend

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/grafa -a grafa-backend
heroku config:set JWT_SECRET=your-secret-key -a grafa-backend
heroku config:set NODE_ENV=production -a grafa-backend

# Deploy
git push heroku main

# View logs
heroku logs --tail -a grafa-backend
```

### Option 2: Deploy to AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y
sudo yum install nodejs npm -y

# Install Node.js v16
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install MongoDB
sudo yum install -y mongodb-org

# Clone repository
git clone your-repo-url
cd grafa/backend

# Install dependencies
npm install

# Create .env file
nano .env
# Add:
# MONGODB_URI=mongodb://localhost:27017/grafa
# JWT_SECRET=your-secret
# PORT=5000
# NODE_ENV=production

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name "grafa-api"
pm2 startup
pm2 save

# Configure Nginx reverse proxy
sudo yum install nginx -y
sudo nano /etc/nginx/sites-available/api.conf

# Add:
# upstream api {
#   server 127.0.0.1:5000;
# }
# server {
#   listen 80;
#   server_name api.grafa.com;
#   location / {
#     proxy_pass http://api;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
#   }
# }

sudo systemctl start nginx
sudo systemctl enable nginx
```

### Option 3: Deploy to Docker + AWS ECS

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY backend/src ./src

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["node", "src/server.js"]
```

Build and push:

```bash
# Build image
docker build -f Dockerfile -t grafa-api:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag grafa-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/grafa-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/grafa-api:latest

# Deploy to ECS
aws ecs create-service --cluster grafa-cluster \
  --service-name grafa-api --task-definition grafa-api:1 \
  --desired-count 3 --launch-type EC2
```

### Docker Compose (Local/Production)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    environment:
      MONGO_INITDB_DATABASE: grafa
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: grafa@secure123
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      MONGODB_URI: mongodb://admin:grafa@secure123@mongodb:27017/grafa
      JWT_SECRET: your-super-secret-key
      NODE_ENV: production
      PORT: 5000
    depends_on:
      - mongodb
    ports:
      - "5000:5000"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

Deploy:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## Environment Setup

### Backend .env File

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/grafa
DB_NAME=grafa

# JWT
JWT_SECRET=your-very-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# API
PORT=5000
NODE_ENV=production
API_URL=https://api.grafa.com

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=grafa-firebase-project
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com

# Email Service
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@grafa.com

# SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (for images)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=grafa-images

# Admin Email
ADMIN_EMAIL=admin@grafa.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Mobile .env.local

```env
EXPO_PUBLIC_API_URL=https://api.grafa.com/api
EXPO_PUBLIC_APP_NAME=GRAFA
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## Production Checklist

- [ ] **Database**
  - [ ] MongoDB Atlas production cluster configured
  - [ ] Backups enabled (daily backups)
  - [ ] Connection pooling configured (maxPoolSize: 10+)
  - [ ] Indexes created on frequently queried fields
  - [ ] Replica set enabled for high availability

- [ ] **Backend**
  - [ ] All environment variables set securely
  - [ ] HTTPS enabled
  - [ ] SQL injection protection (Joi validation)
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled
  - [ ] Error logging (Sentry/DataDog)
  - [ ] Health check endpoint working
  - [ ] PM2 configured for auto-restart
  - [ ] SSL certificate installed (Let's Encrypt)

- [ ] **Mobile**
  - [ ] API endpoints point to production
  - [ ] Firebase configured for production
  - [ ] App signing key created and backed up
  - [ ] Version number updated
  - [ ] Crash reporting enabled (Sentry)
  - [ ] Analytics configured (Google Analytics/Mixpanel)

- [ ] **Admin Web**
  - [ ] API endpoints updated to production
  - [ ] Security headers configured
  - [ ] HTTPS enforced
  - [ ] CDN configured for assets

- [ ] **Monitoring & Alerts**
  - [ ] Application monitoring (New Relic/DataDog)
  - [ ] Error tracking (Sentry)
  - [ ] Uptime monitoring (UptimeRobot)
  - [ ] Email alerts configured
  - [ ] SMS alerts configured (critical issues)

- [ ] **Security**
  - [ ] JWT secrets rotated and secured
  - [ ] API keys stored in environment variables
  - [ ] Database credentials encrypted
  - [ ] CORS whitelist configured
  - [ ] Rate limiting enabled
  - [ ] Input validation on all endpoints
  - [ ] HTTPS/TLS enabled
  - [ ] Security headers (X-Frame-Options, CSP, etc.)

- [ ] **Performance**
  - [ ] Response time <2s (API)
  - [ ] Database queries optimized
  - [ ] Caching strategy implemented (Redis)
  - [ ] CDN configured for static assets
  - [ ] API response compression enabled (gzip)

- [ ] **Compliance**
  - [ ] Privacy policy published
  - [ ] Terms of service defined
  - [ ] Data retention policy set
  - [ ] GDPR compliance (if EU users)
  - [ ] Farmer data protection measures
  - [ ] Phone verification in place

- [ ] **Testing**
  - [ ] Unit tests passing (>80% coverage)
  - [ ] API integration tests passing
  - [ ] Mobile app tested on multiple devices
  - [ ] Load testing completed
  - [ ] User acceptance testing done

- [ ] **Deployment**
  - [ ] CI/CD pipeline configured
  - [ ] Automated testing in pipeline
  - [ ] Rollback procedure documented
  - [ ] Deployment runbook created
  - [ ] Database migration tested
  - [ ] Downtime minimized (<5 minutes)

---

## Useful Commands

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev          # Start with nodemon
npm test            # Run tests

# Mobile
cd mobile
npm install
expo start          # Run locally
npm run build:apk   # Build APK

# Admin Web
cd admin-web
npm install
npm start           # Local development server
npm run build       # Create production build
```

### Production Monitoring

```bash
# Monitor Heroku app
heroku logs --tail

# View EC2 processes
pm2 list
pm2 logs

# Check Docker containers
docker ps
docker logs -f container-id

# MongoDB shell
mongo "mongodb://user:pass@localhost:27017/grafa"
db.crops.find().pretty()

# View API health
curl https://api.grafa.com/health
```

### Backup & Recovery

```bash
# Backup MongoDB
mongodump --uri "mongodb://user:pass@localhost:27017/grafa" --out ./backup

# Restore MongoDB
mongorestore --uri "mongodb://user:pass@localhost:27017/grafa" ./backup

# AWS S3 backup
aws s3 sync ./backup s3://grafa-backups/$(date +%Y-%m-%d)/
```

---

## Support & Updates

For updates, documentation, and support:
- GitHub: https://github.com/basavaraju/grafa
- Documentation: https://docs.grafa.app
- Issues: https://github.com/basavaraju/grafa/issues

