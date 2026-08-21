const geolib = require('geolib');

/**
 * District coordinates (center points for Indian districts)
 */
const DISTRICT_COORDINATES = {
  hassan: { latitude: 13.203, longitude: 75.9239, name: 'Hassan' },
  chikmagalur: { latitude: 13.3186, longitude: 75.7797, name: 'Chikmagalur' },
  bangalore: { latitude: 12.9716, longitude: 77.5946, name: 'Bangalore' },
  tumkur: { latitude: 13.2167, longitude: 77.1167, name: 'Tumkur' },
  mandya: { latitude: 12.5694, longitude: 76.1743, name: 'Mandya' },
  mysore: { latitude: 12.2958, longitude: 76.6394, name: 'Mysore' },
  kolar: { latitude: 13.1339, longitude: 78.1304, name: 'Kolar' },
};

/**
 * Get district from user coordinates (reverse geolocation)
 * Simple approach: Find nearest district center
 */
const getDistrictFromCoordinates = (latitude, longitude) => {
  let nearestDistrict = null;
  let minDistance = Infinity;

  Object.entries(DISTRICT_COORDINATES).forEach(([key, coords]) => {
    const distance = geolib.getDistance(
      { latitude, longitude },
      { latitude: coords.latitude, longitude: coords.longitude }
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestDistrict = { key, ...coords, distance };
    }
  });

  return minDistance < 50000 ? nearestDistrict : null; // 50km radius
};

/**
 * Check if two locations are in the same district
 */
const isSameDistrict = (lat1, lon1, lat2, lon2) => {
  const district1 = getDistrictFromCoordinates(lat1, lon1);
  const district2 = getDistrictFromCoordinates(lat2, lon2);

  return district1?.key === district2?.key;
};

/**
 * Calculate distance between two points in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  return geolib.getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
};

/**
 * Get all districts
 */
const getAllDistricts = () => {
  return Object.values(DISTRICT_COORDINATES).map(d => d.name);
};

module.exports = {
  getDistrictFromCoordinates,
  isSameDistrict,
  calculateDistance,
  getAllDistricts,
  DISTRICT_COORDINATES,
};
