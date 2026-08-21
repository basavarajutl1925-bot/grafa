/**
 * Location-Based Ad System Examples
 * 
 * Demonstrates how to use the location-based ad features
 */

// ============================================
// 1. USER LOGIN & LOCATION DETECTION
// ============================================

// Mobile App - Automatic login with location
async function mobileAppLogin(deviceId, latitude, longitude) {
  const response = await fetch(
    'http://localhost:5000/api/auth/user/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, latitude, longitude })
    }
  );
  
  const data = await response.json();
  // Store token for future requests
  localStorage.setItem('userToken', data.token);
  return data;
  
  // Output:
  // {
  //   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  //   user: {
  //     id: "507f1f77bcf86cd799439011",
  //     deviceId: "device-uuid",
  //     role: "user"
  //   }
  // }
}

// Detect district from coordinates
async function detectDistrict(latitude, longitude) {
  const response = await fetch(
    'http://localhost:5000/api/location/district',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    }
  );
  
  const data = await response.json();
  console.log(`User is in ${data.district}`);
  // Output: { district: "Hassan", key: "hassan", distance: 245 }
  return data;
}

// Get all available districts
async function getDistricts() {
  const response = await fetch(
    'http://localhost:5000/api/location/districts'
  );
  
  const data = await response.json();
  console.log('Available districts:', data.districts);
  // Output: { districts: ["Hassan", "Bangalore", "Chikmagalur", ...] }
}

// ============================================
// 2. BROWSING ADS (Normal User)
// ============================================

async function getAdFeed(district) {
  const token = localStorage.getItem('userToken');
  
  const response = await fetch(
    `http://localhost:5000/api/ads/feed?district=${district}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  console.log(`Found ${data.count} ads in ${district}`);
  
  // Output:
  // {
  //   ads: [
  //     {
  //       _id: "507f...",
  //       title: "Fresh Vegetables",
  //       description: "Daily fresh produce",
  //       district: "Hassan",
  //       shopLocation: "Main Market",
  //       contactPhone: "9876543210",
  //       impressions: 125,
  //       clicks: 34,
  //       status: "active"
  //     },
  //     ...
  //   ],
  //   count: 42
  // }
  
  return data;
}

// Track when user views an ad
async function trackAdView(adId) {
  const response = await fetch(
    `http://localhost:5000/api/ads/${adId}/view`,
    { method: 'POST' }
  );
  return response.json();
}

// Track when user clicks an ad
async function trackAdClick(adId) {
  const response = await fetch(
    `http://localhost:5000/api/ads/${adId}/click`,
    { method: 'POST' }
  );
  return response.json();
}

// ============================================
// 3. POSTING ADS (Normal User)
// ============================================

async function postAd(adData) {
  const token = localStorage.getItem('userToken');
  
  const response = await fetch(
    'http://localhost:5000/api/ads/request',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: adData.title,
        description: adData.description,
        district: adData.district,  // Auto-detected
        category: adData.category,
        shopLocation: adData.shopLocation,
        contactPhone: adData.contactPhone,
        contactEmail: adData.contactEmail,
        images: adData.images || []
      })
    }
  );
  
  const data = await response.json();
  console.log('Ad submitted for approval:', data.ad._id);
  
  // Output:
  // {
  //   ad: {
  //     _id: "507f...",
  //     userId: "507f...",
  //     title: "Fresh Vegetables",
  //     district: "Hassan",
  //     status: "pending",  // Waiting for admin approval
  //     createdAt: "2024-01-07T10:00:00Z"
  //   },
  //   message: "Ad request submitted for approval"
  // }
  
  return data;
}

// Example: Mobile screen to post ad
function PostAdScreen() {
  const [formData, setFormData] = React.useState({
    title: 'Fresh Tomatoes',
    description: 'Daily farm-fresh tomatoes, direct from field',
    category: 'Produce',
    shopLocation: '123 Main Market, Hassan',
    contactPhone: '+91-9876543210',
    contactEmail: 'farmer@example.com'
  });
  
  const handleSubmit = async () => {
    try {
      const { district } = await detectDistrict(latitude, longitude);
      await postAd({ ...formData, district });
      alert('Ad posted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <View>
      {/* Form inputs */}
      <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit Ad</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 4. ADMIN APPROVAL WORKFLOW
// ============================================

// Get pending ads (Admin only)
async function getPendingAds(page = 1, limit = 20) {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `http://localhost:5000/api/admin/ads/pending?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  
  const data = await response.json();
  console.log(`${data.total} pending ads (Page ${data.page}/${data.totalPages})`);
  
  // Output:
  // {
  //   ads: [...],
  //   total: 156,
  //   page: 1,
  //   totalPages: 8
  // }
  
  return data;
}

// Approve ad (Admin only)
async function approveAd(adId) {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `http://localhost:5000/api/admin/ads/${adId}/approve`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  
  const data = await response.json();
  console.log('Ad approved, now visible to users:', data.ad.status); // "active"
  return data;
}

// Reject ad (Admin only)
async function rejectAd(adId, reason) {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `http://localhost:5000/api/admin/ads/${adId}/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason })
    }
  );
  
  const data = await response.json();
  console.log('Ad rejected:', data.ad.status); // "rejected"
  return data;
}

// Bulk approve ads (for high volume) - Admin only
async function bulkApproveAds(adIds) {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    'http://localhost:5000/api/admin/ads/bulk/approve',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ adIds })
    }
  );
  
  const data = await response.json();
  console.log(`Bulk approved ${data.modifiedCount} ads`);
  return data;
}

// Example: Admin approval batch process
async function approveNewAds() {
  const pendingAds = await getPendingAds(1, 100);
  const adIdsToApprove = pendingAds.ads
    .filter(ad => ad.district === 'Hassan')  // Filter by criteria
    .map(ad => ad._id);
  
  if (adIdsToApprove.length > 0) {
    await bulkApproveAds(adIdsToApprove);
  }
}

// ============================================
// 5. ADMIN ANALYTICS
// ============================================

async function getDashboardStats() {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    'http://localhost:5000/api/admin/dashboard/stats',
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  
  const stats = await response.json();
  
  // Output:
  // {
  //   totalPendingAds: 45,
  //   totalActiveAds: 234,
  //   totalRejectedAds: 12,
  //   adsByDistrict: [
  //     { _id: "Hassan", count: 89 },
  //     { _id: "Bangalore", count: 76 },
  //     { _id: "Chikmagalur", count: 69 },
  //     ...
  //   ]
  // }
  
  return stats;
}

async function getAdAnalytics(adId) {
  const adminToken = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `http://localhost:5000/api/ads/analytics/summary`,
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  
  const analytics = await response.json();
  
  // Output:
  // {
  //   totalAds: 300,
  //   activeAds: 234,
  //   pendingAds: 45,
  //   totalImpressions: 45320,
  //   totalClicks: 3420
  // }
  
  return analytics;
}

// ============================================
// 6. USER'S ADS MANAGEMENT
// ============================================

// Get user's own ads
async function getMyAds() {
  const token = localStorage.getItem('userToken');
  
  const response = await fetch(
    'http://localhost:5000/api/ads/my-ads',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  // Output:
  // {
  //   ads: [
  //     {
  //       _id: "507f...",
  //       title: "Fresh Vegetables",
  //       status: "active",  // or "pending", "rejected", "expired"
  //       district: "Hassan",
  //       createdAt: "2024-01-07T10:00:00Z",
  //       impressions: 125,
  //       clicks: 34
  //     },
  //     ...
  //   ]
  // }
  
  return data;
}

// ============================================
// 7. COMPLETE USER FLOW EXAMPLE
// ============================================

async function completeUserFlow() {
  try {
    // Step 1: Get device location
    const geoLocation = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const { latitude, longitude } = geoLocation.coords;
    
    // Step 2: Login with device
    const loginResponse = await mobileAppLogin(
      'device-' + new Date().getTime(),
      latitude,
      longitude
    );
    
    // Step 3: Detect user's district
    const districtData = await detectDistrict(latitude, longitude);
    console.log(`You are in ${districtData.district}`);
    
    // Step 4: Get ads for user's district
    const adFeed = await getAdFeed(districtData.district);
    console.log(`${adFeed.count} ads found in ${districtData.district}`);
    
    // Step 5: User views ads
    for (const ad of adFeed.ads.slice(0, 5)) {
      await trackAdView(ad._id);
    }
    
    // Step 6: User wants to post an ad
    const newAd = {
      title: 'My Shop Discount',
      description: 'Get 20% off on all items',
      category: 'Retail',
      shopLocation: '456 Market Street, Hassan',
      contactPhone: '+91-9999999999',
      contactEmail: 'shop@example.com',
      images: [],
      district: districtData.district
    };
    
    await postAd(newAd);
    
    // Step 7: Check ad status
    const myAds = await getMyAds();
    console.log('My ads:', myAds.ads);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================
// 8. PERFORMANCE TIPS
// ============================================

// Cache districts to reduce API calls
const districtCache = {};

async function getDistrictCached(latitude, longitude) {
  const key = `${latitude},${longitude}`;
  
  if (districtCache[key]) {
    return districtCache[key];
  }
  
  const district = await detectDistrict(latitude, longitude);
  districtCache[key] = district;
  
  // Cache for 1 hour
  setTimeout(() => delete districtCache[key], 3600000);
  
  return district;
}

// Batch track multiple ad views
async function batchTrackViews(adIds) {
  const promises = adIds.map(adId => trackAdView(adId));
  return Promise.all(promises);
}

// Pagination for large ad lists
async function loadMoreAds(district, page = 1) {
  // Note: Current implementation doesn't support pagination
  // but can be easily added to the API
  const response = await fetch(
    `http://localhost:5000/api/ads/feed?district=${district}&page=${page}&limit=20`
  );
  return response.json();
}
