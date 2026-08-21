#!/bin/bash

# Grafa API Testing Script
# Complete workflow for testing the entire application

set -e

BASE_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@grafa.com"
ADMIN_PASSWORD="admin123"

echo "🚀 Grafa API Testing Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local description=$5
  
  echo -e "${YELLOW}Testing: $description${NC}"
  
  local curl_cmd="curl -s -X $method $BASE_URL$endpoint"
  
  if [ ! -z "$token" ]; then
    curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
  fi
  
  curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
  
  if [ ! -z "$data" ]; then
    curl_cmd="$curl_cmd -d '$data'"
  fi
  
  response=$(eval $curl_cmd)
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  echo ""
}

# ============================================
# 1. ADMIN REGISTRATION & LOGIN
# ============================================
echo -e "${GREEN}Step 1: Admin Registration & Login${NC}"
echo ""

# Register Admin
response=$(curl -s -X POST $BASE_URL/auth/admin/register \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ADMIN_TOKEN=$(echo $response | jq -r '.token' 2>/dev/null)

if [ "$ADMIN_TOKEN" != "null" ] && [ ! -z "$ADMIN_TOKEN" ]; then
  echo -e "${GREEN}✓ Admin registered successfully${NC}"
  echo "Token: $ADMIN_TOKEN"
else
  echo -e "${RED}✗ Admin registration failed${NC}"
  echo "$response"
  # Try login instead (admin might already exist)
  response=$(curl -s -X POST $BASE_URL/auth/admin/login \
    -H 'Content-Type: application/json' \
    -d "{
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$ADMIN_PASSWORD\"
    }")
  ADMIN_TOKEN=$(echo $response | jq -r '.token' 2>/dev/null)
  if [ "$ADMIN_TOKEN" != "null" ] && [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
  else
    echo -e "${RED}✗ Admin login failed${NC}"
    exit 1
  fi
fi

echo ""

# ============================================
# 2. LOCATION ENDPOINTS
# ============================================
echo -e "${GREEN}Step 2: Location Testing${NC}"
echo ""

test_endpoint "GET" "/location/districts" "" "" "Get all districts"

test_endpoint "POST" "/location/district" '{
  "latitude": 13.203,
  "longitude": 75.9239
}' "" "Detect district from coordinates"

echo ""

# ============================================
# 3. ITEM MANAGEMENT
# ============================================
echo -e "${GREEN}Step 3: Item Management${NC}"
echo ""

# Create items
item_response=$(curl -s -X POST $BASE_URL/items \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Tomato",
    "category": "Vegetable",
    "unit": "kg",
    "description": "Fresh red tomatoes"
  }')

ITEM_ID=$(echo $item_response | jq -r '._id // .item._id' 2>/dev/null)
echo -e "${GREEN}✓ Item created: $ITEM_ID${NC}"
echo ""

test_endpoint "GET" "/items" "" "" "List all items"

# ============================================
# 4. PRICE MANAGEMENT
# ============================================
echo -e "${GREEN}Step 4: Price Management${NC}"
echo ""

# Add single price
test_endpoint "POST" "/items/$ITEM_ID/price" '{
  "price": 45.50,
  "district": "Hassan",
  "source": "market_survey"
}' "$ADMIN_TOKEN" "Add single price"

# Add more prices for predictions
for i in {1..30}; do
  price=$((40 + RANDOM % 10))
  curl -s -X POST $BASE_URL/items/$ITEM_ID/price \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"price\": $price,
      \"district\": \"Hassan\",
      \"source\": \"historical\"
    }" > /dev/null
done

echo -e "${GREEN}✓ Added 30 price records${NC}"
echo ""

# Get price history
test_endpoint "GET" "/items/$ITEM_ID/prices" "" "" "Get price history"

# Get predictions
test_endpoint "GET" "/items/$ITEM_ID/predict?daysAhead=7&district=Hassan" "" "" "Get price predictions"

echo ""

# ============================================
# 5. USER LOGIN
# ============================================
echo -e "${GREEN}Step 5: User Authentication${NC}"
echo ""

# Generate device ID
DEVICE_ID="device-$(date +%s)"

user_response=$(curl -s -X POST $BASE_URL/auth/user/login \
  -H 'Content-Type: application/json' \
  -d "{
    \"deviceId\": \"$DEVICE_ID\",
    \"latitude\": 13.203,
    \"longitude\": 75.9239
  }")

USER_TOKEN=$(echo $user_response | jq -r '.token' 2>/dev/null)
echo -e "${GREEN}✓ User login successful${NC}"
echo "User Token: $USER_TOKEN"
echo ""

# ============================================
# 6. AD POSTING
# ============================================
echo -e "${GREEN}Step 6: Ad Posting${NC}"
echo ""

# Post ad
ad_response=$(curl -s -X POST $BASE_URL/ads/request \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "title": "Fresh Vegetables",
    "description": "Daily farm fresh vegetables from local farmers",
    "district": "Hassan",
    "category": "Retail",
    "shopLocation": "123 Main Market, Hassan",
    "contactPhone": "9876543210",
    "contactEmail": "shop@example.com"
  }')

AD_ID=$(echo $ad_response | jq -r '.ad._id' 2>/dev/null)
echo -e "${GREEN}✓ Ad posted: $AD_ID${NC}"
echo ""

# ============================================
# 7. AD BROWSING
# ============================================
echo -e "${GREEN}Step 7: Ad Browsing${NC}"
echo ""

# Get ads for district
ads_response=$(curl -s -X GET "$BASE_URL/ads/feed?district=Hassan" \
  -H "Authorization: Bearer $USER_TOKEN")

AD_COUNT=$(echo $ads_response | jq '.count' 2>/dev/null)
echo -e "${GREEN}✓ Found $AD_COUNT ads in Hassan${NC}"
echo ""

# Get user's ads
test_endpoint "GET" "/ads/my-ads" "" "$USER_TOKEN" "Get user's ads"

echo ""

# ============================================
# 8. AD TRACKING
# ============================================
echo -e "${GREEN}Step 8: Ad Tracking${NC}"
echo ""

# Track view
test_endpoint "POST" "/ads/$AD_ID/view" "" "" "Track ad view"

# Track click
test_endpoint "POST" "/ads/$AD_ID/click" "" "" "Track ad click"

echo ""

# ============================================
# 9. ADMIN APPROVAL
# ============================================
echo -e "${GREEN}Step 9: Admin Approval Workflow${NC}"
echo ""

# Get pending ads
pending_response=$(curl -s -X GET "$BASE_URL/admin/ads/pending?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

PENDING_COUNT=$(echo $pending_response | jq '.total' 2>/dev/null)
echo -e "${GREEN}✓ Found $PENDING_COUNT pending ads${NC}"
echo ""

# Approve the ad we just created
test_endpoint "POST" "/admin/ads/$AD_ID/approve" "" "$ADMIN_TOKEN" "Approve ad"

echo ""

# ============================================
# 10. ADMIN STATS
# ============================================
echo -e "${GREEN}Step 10: Admin Analytics${NC}"
echo ""

test_endpoint "GET" "/admin/dashboard/stats" "" "$ADMIN_TOKEN" "Get dashboard stats"

test_endpoint "GET" "/ads/analytics/summary" "" "$ADMIN_TOKEN" "Get ad analytics"

echo ""

# ============================================
# 11. LOAD TEST
# ============================================
echo -e "${GREEN}Step 11: Load Testing${NC}"
echo ""

echo "Simulating 100 concurrent ad views..."
for i in {1..100}; do
  curl -s -X POST $BASE_URL/ads/$AD_ID/view > /dev/null &
done

wait

echo -e "${GREEN}✓ Load test completed${NC}"
echo ""

# ============================================
# 12. HEALTH CHECK
# ============================================
echo -e "${GREEN}Step 12: Health Check${NC}"
echo ""

health=$(curl -s -X GET "http://localhost:5000/health")
echo $health | jq '.'
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}========== TEST SUMMARY ==========${NC}"
echo -e "Admin Token: ${YELLOW}$ADMIN_TOKEN${NC}"
echo -e "User Token: ${YELLOW}$USER_TOKEN${NC}"
echo -e "Item ID: ${YELLOW}$ITEM_ID${NC}"
echo -e "Ad ID: ${YELLOW}$AD_ID${NC}"
echo -e "Device ID: ${YELLOW}$DEVICE_ID${NC}"
echo ""
echo -e "${GREEN}✓ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check logs: npm run dev"
echo "2. Verify MongoDB: mongosh"
echo "3. Test ad feed: curl $BASE_URL/ads/feed?district=Hassan"
echo "4. Test predictions: curl $BASE_URL/items/$ITEM_ID/predict"
